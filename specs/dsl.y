/* description: Parses end evaluates mathematical expressions. */

/* lexical grammar */
%lex
%%
\s+                   {/* skip whitespace */}
"var"                 {return 'VAR';}
"new"                 {return 'NEW';}
"export"              {return 'EXPORT'}
"value"               {return 'VALUE'}
"gas"                 {return 'GAS'}
"="                   {return '='}
"("                   {return '('}
")"                   {return ')'}
"."                   {return '.'}
","                   {return ','}
\"([^\"]*)\"          {yytext = this.matches[1]; return 'STRING';}
/* \d+.\d*               {yytext = parseFloat(yytext); return 'NUMBER';} */
\d+                   {yytext = parseInt(yytext); return 'NUMBER';}
\w+                   {return 'SYMB';}
<<EOF>>               {return 'EOF';}

/lex

/* operator associations and precedence */

%start DSL

%% /* language grammar */

DSL: FORMULAS 
   { return $1; }
   ;

FORMULAS: FORMULA EOF
          { $$ = new yy.i.Expr( [$1], [], yy.i.TYPE.SEQ ); }
        | FORMULA FORMULAS
          { $2.value = [$1].concat( $2.value ); $$ = $2; }
        ;

FORMULA: DECLARATION
       | EXPORT SYMB
       { $$ = new yy.i.Expr( yy.i.export, [$SYMB], yy.i.TYPE.EXPORT ) }
       | TERM
       ;

DECLARATION: VAR SYMB "=" TERM
           { $$ = new yy.i.Expr( yy.i.assign, [ $SYMB, $TERM ], yy.i.TYPE.ASSIGN ); }
           ;

TERM: DEPLOYMENT
    | STRING
    { $$ = new yy.i.Expr( $1, [], yy.i.TYPE.STRING ); }
    | NUMBER
    { $$ = new yy.i.Expr( $1, [], yy.i.TYPE.NUMBER ); }
    | ADDRESS_CALL
    | SYMBOL
    ;

ADDRESS_CALL: SYMBOL '.' SYMBOL '(' ')'
            { $$ = new yy.i.Expr( yy.i.call, [$1, $3, [], { value: 0, gas: undefined }], yy.i.TYPE.CALL ); }
            | SYMBOL '.' SYMBOL '(' ARGS ')'
            { $$ = new yy.i.Expr( yy.i.call, [$1, $3, $ARGS, { value: 0, gas: undefined }], yy.i.TYPE.CALL ); }
            | SYMBOL '.' SYMBOL '.' OPT_CALL '(' ')'
            { $$ = new yy.i.Expr( yy.i.call, [$1, $3, [], $OPT_CALL], yy.i.TYPE.CALL ); }
            | SYMBOL '.' SYMBOL '.' OPT_CALL '(' ARGS ')'
            { $$ = new yy.i.Expr( yy.i.call, [$1, $3, $ARGS, $OPT_CALL], yy.i.TYPE.CALL ); }
            ;


DEPLOYMENT: NEW SYMB "(" ")"
          { $$ = new yy.i.Expr( yy.i.deploy, [ $SYMB, [], {value: 0, gas:undefined} ], yy.i.TYPE.DEPLOY ); }
          | NEW SYMB "(" ARGS ")"
          { $$ = new yy.i.Expr( yy.i.deploy, [ $SYMB, $ARGS, {value: 0, gas:undefined} ], yy.i.TYPE.DEPLOY ); }
          | NEW SYMB '.' OPT_CALL "(" ")"
          { $$ = new yy.i.Expr( yy.i.deploy, [ $SYMB, [], $OPT_CALL ], yy.i.TYPE.DEPLOY ); }
          | NEW SYMB '.' OPT_CALL "(" ARGS ")"
          { $$ = new yy.i.Expr( yy.i.deploy, [ $SYMB, $ARGS, $OPT_CALL ], yy.i.TYPE.DEPLOY ); }
          ;

OPT_CALL:
        | VALUE '(' NUMBER ')'
        { $$ = {value: $NUMBER, gas: undefined}; }
        | VALUE '(' NUMBER ')' '.' OPT_CALL
        { $$ = {value: $NUMBER, gas: $OPT_CALL.gas}; }
        | GAS '(' NUMBER ')'
        { $$ = {value: 0, gas: $NUMBER}; }
        | GAS '(' NUMBER ')' '.' OPT_CALL
        { $$ = {value:0, gas: $NUMBER}; }
        ;

ARGS: TERM
    { $$ = new yy.i.Expr( [$1], [], yy.i.TYPE.SEQ ); }
    | TERM ',' ARGS
    { $3.value = [$1].concat( $3.value ); $$ = $3; }
    ;

SYMBOL: SYMB 
      { $$ = new yy.i.Expr( $1, [], yy.i.TYPE.SYMBOL ); }
      ;

