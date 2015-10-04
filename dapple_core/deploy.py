from __future__ import print_function
import ethereum, eth_rpc_client, re, time
import dapple_core
from dapple import cli, DappleException, plugins
from pyparsing import (Word, alphas, alphanums, nums, Regex, Keyword, Group,
                       Combine, Forward, Suppress, Optional, OneOrMore, oneOf,
                       QuotedString, quotedString, ZeroOrMore,
                       delimitedList, restOfLine, removeQuotes)

def parser():
    eq = Keyword("==").suppress()
    ne = Keyword("!=").suppress()
    gte = Keyword(">=").suppress()
    lte = Keyword("<=").suppress()
    gt = Keyword(">").suppress()
    lt = Keyword("<").suppress()
    lparen = Keyword("(").suppress()
    rparen = Keyword(")").suppress()
    dotdot = Keyword("..").suppress()
    colon = Keyword(":").suppress()
    assignOp = Keyword('=').suppress()
    sign   = Word("+-", exact=1)
    nonzero = ''.join([str(i) for i in range(1, 10)])

    True_ = Word("true").setParseAction(lambda *args: True)
    False_ = Word("false").setParseAction(lambda *args: False)
    Boolean_ = True_ | False_ 

    Int_  = Combine(Optional(sign) + Word(nonzero, nums)).setParseAction(lambda l, s, t: int(t[0]))
    Hex_  = Regex("0x[A-Fa-f0-9]+").setResultsName('hex')

    Term_ = Word(alphas, alphanums + "_")
    VarToken_ = Combine('$' + Term_)
    Var_ = Group(VarToken_).setResultsName('var')
    String_ = quotedString.copy().setParseAction(removeQuotes).setResultsName('string')

    Val_ = Forward()
    Vals_ = Group(delimitedList(Val_, delim=' ')).setResultsName('vals')

    In_  = Group(Val_ + Keyword("in", caseless=True).suppress() + lparen + Vals_ + rparen).setResultsName('in')

    Eq_ = Group(Val_ + eq + Val_).setResultsName('eq')
    Ne_ = Group(Val_ + ne + Val_).setResultsName('ne')
    Gte_ = Group(Val_ + gte + Val_).setResultsName('gte')
    Lte_ = Group(Val_ + lte + Val_).setResultsName('lte')
    Gt_ = Group(Val_ + gt + Val_).setResultsName('gt')
    Lt_ = Group(Val_ + lt + Val_).setResultsName('lt')

    Range_ = Group(lparen +
                       Optional(Val_, default=None).setResultsName('min') + dotdot +
                       Optional(Val_, default=None).setResultsName('max') +
                   rparen).setResultsName('range')

    Or_ = Forward()

    Parens_ = Group(Suppress("(") + Or_ + Suppress(")")).setResultsName("parens") | Val_ 

    Not_ = Forward()
    Not_ << (Group(Suppress(Keyword("not", caseless=True)) + Not_
    ).setResultsName("not") | Parens_)

    And_ = Forward()
    And_ << (Group(Not_ + Suppress(Keyword("and", caseless=True)) + And_
                   ).setResultsName("and") | Not_)

    Or_ << (Group(And_ + Suppress(Keyword("or", caseless=True)) + Or_
                  ).setResultsName("or") | And_)

    Assign_ = Group(VarToken_ + assignOp + Val_).setResultsName('assign')

    Contract_ = Regex(
            '([A-Za-z_][A-Za-z0-9_]*)'
            '\(((?:0x[A-Fa-f0-9]+)'
            '|(?:\$[A-Za-z_][A-Za-z0-9_]*))\)').setResultsName('contract')

    Send_ = Group((Keyword("send") | Keyword("asend"))
            + Optional(Int_) + (Contract_ | Var_) + Optional(Var_ | Term_)
            + Optional(Vals_)).setResultsName('send')

    Call_ = Group(Keyword("call")
            + Optional(Int_) + (Var_ | Contract_) + Optional(Var_ | Term_)
            + Optional(Vals_)).setResultsName('call')

    Address_ = Group(Keyword("address")
            + (Var_ | Contract_)).setResultsName('address')

    Deploy_ = Group(Keyword("deploy") + (Var_ | Term_) + (Var_ | Term_)).setResultsName('deploy')

    Expression_ = (And_ | Or_ | Eq_ | Ne_ | Gte_ 
            | Lte_ | Gt_ | Lt_ | In_ | Range_
            | Call_ | Deploy_ | Send_)

    Val_ << (Hex_ | Int_ | Boolean_ | String_ | Var_ | Expression_)

    Statement_ = (Contract_ | Assign_ | Send_ | Call_ | Deploy_ | Val_)

    return Statement_


class DappleSyntaxException(DappleException):
    pass


class DappleUndeclaredException(DappleException):
    pass


class DappleDisallowedOperation(DappleException):
    pass

class Scope(object):
    def __init__(self, parent=None):
        self.parent = parent
        self.values = {}

    def get(self, name):
        scope = self.scope_with(name)
        if scope is None:
            raise DappleUndeclaredException(name)

        return scope.values[name]

    def set(self, name, value):
        self.values[name] = value
        return value

    def scope_with(self, name):
        if name in self.values:
            return self

        if self.parent is None:
            return None

        return self.parent.scope_with(name)


class RPCContract():
    def __init__(self, client, abi, address=None):
        self.address = address
        self._translator = ethereum.abi.ContractTranslator(abi)
        self.abi = abi
        self.client = client

    def _do(self, func, sender=None, to=None, gas=-1,
            gas_price=-1, value=0, data=None,
            wait_until=None, block='latest'):

        if to is None:
            to = self.address

        if sender is None:
            sender = self.client.default_from_address

        # Using -1 to allow the user to pass None if
        # they want to use the RPC client's defaults.
        # Not using 0 because it's technically a
        # valid value.
        if gas_price == -1:
            gas_price = self.client.get_gas_price()

        params = eth_rpc_client.get_transaction_params(
                _from=from_address, gas_price=gas_price,
                data=data)

        if gas == -1:
            gas = hex(self.client.make_rpc_request(
                'eth_estimateGas', [params, 'latest'])['result'])

        result = func(
            _from=sender, to=to, gas_price=gas_price,
            gas=gas, data=data)

        if wait_until:
            return self.wait_until(result, wait_until)

        return result

    def wait_until(self, tx_hash, check_func):
        receipt = self.client.get_transaction_receipt(tx_hash)

        while not check_func(receipt):
            time.sleep(1)
            receipt = self.client.get_transaction_receipt(tx_hash)

        return receipt

    def _do_command(self, func, command, *args, **kwargs):
        kwargs['data'] = self._translator.encode(command, args)
        return self._do(func, **kwargs)

    def send(self, **kwargs):
        return self._do(self.client.send_transaction, **kwargs)

    def send_command(self, *args, **kwargs):
        return self._do_command(self.client.send_transaction, *args, **kwargs)

    def call(self, **kwargs):
        return self._do(self.client.call, **kwargs)

    def call_command(self, command, *args, **kwargs):
        return self._do_command(self.client.call, *args, **kwargs)


class ClientWrapper(object):
    def __init__(self, client):
        self.client = client

    def _send(self, sender, to, value, evmdata=''):
        return self.client.send()


class DeployScript(object):
    """
    A deploy script.

    >>> source = \"\"\"
    ... $x = 4
    ... $y = $x
    ... $z = 'foo'
    ... $yes = true
    ... $no = false
    ... $also_yes = $yes or $no
    ... $z
    ... \"\"\"
    >>> s = Scope()
    >>> script = DeployScript(None, None, source)
    >>> script.run(scope=s)
    'foo'
    >>> s.get('$x')
    4
    >>> s.get('$y')
    4
    >>> s.get('$z')
    'foo'
    >>> s.get('$yes')
    True
    >>> s.get('$no')
    False
    >>> s.get('$also_yes')
    True
    >>> script.run_line('0x4', s)
    '0x4'
    >>> script.run_line('$x', s)
    4

    """
    def __init__(self, client, build, script):
        self.client = client
        self.build = build
        self.script = script
        self.parser = parser()
    
        self._event_handlers = {
            'before_deploy': [],
            'on_deploy': []
        }

        self._methods = {
            'and': lambda t: self.eval(t[0]) and self.eval(t[1]),
            'or': lambda t: self.eval(t[0]) or self.eval(t[1]),
            'not': lambda t: not self.eval(t[0]),
            'parens': lambda t: self.eval(t[0]),
            'eq': lambda t: self.eval(t[0]) == self.eval(t[1]),
            'neq': lambda t: self.eval(t[0]) != self.eval(t[1]),
            'gte': lambda t: self.eval(t[0]) >= self.eval(t[1]),
            'lte': lambda t: self.eval(t[0]) <= self.eval(t[1]),
            'gt': lambda t: self.eval(t[0]) > self.eval(t[1]),
            'lt': lambda t: self.eval(t[0]) < self.eval(t[1]),
            'range': lambda t: range(self.eval(t[1]), self.eval(t[2])),
            'in': lambda t: t[0] in t[1],
            'assign': lambda t: self.scope.set(
                t[0][0], self.eval(t[0][1])),
            'var': lambda t: (self.eval(t[0])
                if hasattr(t[0], 'getName')
                else self.scope.get(t[0])),
            'send': self._send,
            'asend': self._asend,
            'call': self._call,
            'deploy': self._deploy,
            'contract': self._contract,
            'assert': self._assert,
            'hex': lambda t: t[0]
        }


    def run(self, scope=None, block_margin=12):
        self.block_margin = block_margin

        if scope is None:
            scope = Scope()

        lines = filter(None, [l.strip() for l in self.script.splitlines()])
        val = None
        for i, line in enumerate(lines):
            try:
                val = self.run_line(line, scope)
            except Exception as e:
                raise e.__class__("Error on line %s: %s" % (i+1, str(e)))

        return val

    def run_line(self, line, scope):
        self.scope = scope
        return self.eval(self.parser.parseString(line))


    def eval(self, parsetree):
        if not hasattr(parsetree, 'getName'):
            return parsetree
        return self._methods[parsetree.getName()](parsetree)

    def on(self, event, callback):
        if event not in self._event_handlers:
            raise DappleException('Unknown event: %s' % event)
        self._event_handlers[event].append(callback)

    def trigger(self, event, *args):
        if event not in self._event_handlers:
            raise DappleException('Unknown event triggered: %s' % event)
        for handler in self._event_handlers[event]:
            handler(*args)

    def before_deploy(self, callback):
        self._before_deploy.append(callback)
    
    def _assert(self, args):
        assert self.eval(args[0][0])
        return True

    def _contract(self, args):
        token = args[0]
        name, address = tuple(re.match('([^\(]+)\(([^\)]+)\)', token).groups())

        if address[0] == '$':
            address = self.run_line(address, self.scope)

        return RPCContract(
            self.client, self.build[name]['abi'], address)

    def _send(self, args):
        value 

    def _asend(self, args):
        pass

    def _call(self, args):
        pass

    def _deploy(self, args):
        name = self.eval(args[0][2])
        contract_type = args[0][1]
        self.trigger('before_deploy', contract_type, name)
        data = self.build[args[0][1]]['bin']
        contract = RPCContract(self.client, self.build[contract_type]['abi'])
        deploy_wait_until = lambda r: (
                r['contractAddress']
                and
                self.client.get_block_number() - self.block_margin
                > int(r['blockNumber']))
        receipt = contract.send(
                _from=from_address, gas_price=gas_price,
                gas=gas, data=data, wait_until=deploy_wait_until)
        contract.address = receipt['address']
        self.trigger('on_deploy', contract)
        
        return contract

@cli.command()
def repl():
    # REPL!
    # readline adds extra features to the
    # input function, such as input history.
    import readline

    try:
        readline.read_init_file('.dapple.rc')
    except Exception:
        print("No valid .dapple.rc in current directory. Using defaults.")

    scope = Scope()
    build = plugins.load('core.build')('repl')
    runner = DeployScript(None, build, None)
    print("REPL engaged. Enter `exit` to quit.")

    line = ''
    while line.lower() != 'exit':
        if line.strip():
            print(runner.run_line(line, scope))

        line = raw_input('>>> ')
