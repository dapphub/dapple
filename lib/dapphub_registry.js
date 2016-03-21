'use strict';

// For geth
if (typeof dapple === 'undefined') {
  var dapple = {};
}

if (typeof web3 === 'undefined' && typeof Web3 === 'undefined') {
  var Web3 = require('web3');
}

dapple['dapphub-registry'] = (function builder () {
  var environments = {
    'morden': {
      'objects': {
        'dapphubdb': {
          'class': 'DappHubDB',
          'address': '0x56c49345e8e6691e2e89725a32b28ba801e248a4'
        }
      }
    }
  };

  function ContractWrapper (headers, _web3) {
    if (!_web3) {
      throw new Error('Must supply a Web3 connection!');
    }

    this.headers = headers;
    this._class = _web3.eth.contract(headers.interface);
  }

  ContractWrapper.prototype.deploy = function () {
    var args = new Array(arguments);
    args[args.length - 1].data = this.headers.bytecode;
    return this._class.new.apply(this._class, args);
  };

  // Wrap pass-through functions by name.
  var passthroughs = ['at', 'new'];
  for (var i = 0; i < passthroughs.length; i += 1) {
    ContractWrapper.prototype[passthroughs[i]] = (function (passthrough) {
      return function () {
        return this._class[passthrough].apply(this._class, arguments);
      };
    })(passthroughs[i]);
  }

  function constructor (_web3, env) {
    if (!env) {
      env = 'morden';
    }
    while (typeof env !== 'object') {
      env = environments[env];
    }

    if (typeof _web3 === 'undefined') {
      if (!env.rpcURL) {
        throw new Error('Need either a Web3 instance or an RPC URL!');
      }
      _web3 = new Web3(new Web3.providers.HttpProvider(env.rpcURL));
    }

    this.headers = {
      'DappHubDB': {
        'interface': [
          {
            'constant': false,
            'inputs': [
              {
                'name': 'new_authority',
                'type': 'address'
              },
              {
                'name': 'mode',
                'type': 'uint8'
              }
            ],
            'name': 'updateAuthority',
            'outputs': [],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'name',
                'type': 'bytes32'
              }
            ],
            'name': 'getLastVersion',
            'outputs': [
              {
                'name': 'major',
                'type': 'uint8'
              },
              {
                'name': 'minor',
                'type': 'uint8'
              },
              {
                'name': 'patch',
                'type': 'uint8'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_authority',
            'outputs': [
              {
                'name': '',
                'type': 'address'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [
              {
                'name': 'name',
                'type': 'bytes32'
              },
              {
                'name': 'major',
                'type': 'uint8'
              },
              {
                'name': 'minor',
                'type': 'uint8'
              },
              {
                'name': 'patch',
                'type': 'uint8'
              }
            ],
            'name': 'getPackageHash',
            'outputs': [
              {
                'name': '',
                'type': 'bytes'
              }
            ],
            'type': 'function'
          },
          {
            'constant': true,
            'inputs': [],
            'name': '_auth_mode',
            'outputs': [
              {
                'name': '',
                'type': 'uint8'
              }
            ],
            'type': 'function'
          },
          {
            'constant': false,
            'inputs': [
              {
                'name': 'name',
                'type': 'bytes32'
              },
              {
                'name': 'major',
                'type': 'uint8'
              },
              {
                'name': 'minor',
                'type': 'uint8'
              },
              {
                'name': 'patch',
                'type': 'uint8'
              },
              {
                'name': '_hash',
                'type': 'bytes'
              }
            ],
            'name': 'setPackage',
            'outputs': [],
            'type': 'function'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'name',
                'type': 'bytes32'
              },
              {
                'indexed': false,
                'name': 'major',
                'type': 'uint8'
              },
              {
                'indexed': false,
                'name': 'minor',
                'type': 'uint8'
              },
              {
                'indexed': false,
                'name': 'patch',
                'type': 'uint8'
              },
              {
                'indexed': false,
                'name': 'ipfs',
                'type': 'bytes'
              }
            ],
            'name': 'PackageUpdate',
            'type': 'event'
          },
          {
            'anonymous': false,
            'inputs': [
              {
                'indexed': true,
                'name': 'auth',
                'type': 'address'
              },
              {
                'indexed': true,
                'name': 'mode',
                'type': 'DSAuthModesEnum.DSAuthModes'
              }
            ],
            'name': 'DSAuthUpdate',
            'type': 'event'
          }
        ]
      }
    };

    this.classes = {};
    for (var key in this.headers) {
      this.classes[key] = new ContractWrapper(this.headers[key], _web3);
    }

    this.objects = {};
    for (var i in env.objects) {
      var obj = env.objects[i];
      this.objects[i] = this.classes[obj['class']].at(obj.address);
    }
  }

  return {
    Class: constructor,
    environments: environments
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = dapple['dapphub-registry'];
}
