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
\"([^\"]*)\"          {yytext = this.matches[1]; return 'STRING';}
/* \d+.\d*               {yytext = parseFloat(yytext); return 'NUMBER';} */
\d+                   {yytext = parseInt(yytext); return 'NUMBER';}
\w+                   {return 'SYMBOL';}
<<EOF>>               {return 'EOF';}

/lex

/* operator associations and precedence */

%start DSL

%% /* language grammar */

DSL: FORMULAS 
   ;

FORMULAS: FORMULA EOF
          { $$ = $1; }
        | FORMULA FORMULAS
          { $$ = $1 && $2; }
        ;

FORMULA: DECLARATION
       { $$ = $DECLARATION; }
       | EXPORT SYMBOL
       { $$ = yy.i.export($SYMBOL); }
       | TERM
       ;

DECLARATION: VAR SYMBOL "=" TERM
           { $$ = yy.i.assign( $SYMBOL, $TERM); }
           ;

TERM: DEPLOYMENT
    | STRING
    { $$ = new yy.i.Var( $1, yy.i.Var.TYPE.STRING ); }
    | NUMBER
    { $$ = new yy.i.Var( $1, yy.i.Var.TYPE.NUMBER ); }
    | ADDRESS_CALL
    ;

ADDRESS_CALL: SYMBOL '.' SYMBOL '(' ')'
            { $$ = yy.i.call( $1, $3, [], { value: 0, gas: undefined }); }
            | SYMBOL '.' SYMBOL '(' ARGS ')'
            { $$ = yy.i.call( $1, $3, $ARGS, { value: 0, gas: undefined } ); }
            | SYMBOL '.' SYMBOL '.' OPT_CALL '(' ')'
            { $$ = yy.i.call( $1, $3, [], $OPT_CALL ); }
            | SYMBOL '.' SYMBOL '.' OPT_CALL '(' ARGS ')'
            { $$ = yy.i.call( $1, $3, $ARGS, $OPT_CALL ); }
            ;


DEPLOYMENT: NEW SYMBOL "(" ")"
           { $$ = yy.i.deploy( $SYMBOL, [], {value: 0, gas:undefined} ); }
           
          | NEW SYMBOL "(" ARGS ")"
           { $$ = yy.i.deploy( $SYMBOL, $ARGS, {value: 0, gas:undefined} ); } 
           
          | NEW SYMBOL '.' OPT_CALL "(" ")"
           { $$ = yy.i.deploy( $SYMBOL, [], $OPT_CALL ); }
           
          | NEW SYMBOL '.' OPT_CALL "(" ARGS ")"
           { $$ = yy.i.deploy( $SYMBOL, $ARGS, $OPT_CALL ); }
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

ARGS: SYMBOL
    { $$ = [$SYMBOL]; }
    | SYMBOL ',' ARGS
    { $$ = [$SYMBOL].concat($ARGS) }
    ;

