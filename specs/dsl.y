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
       { $$ = yy.export($SYMBOL); }
       | TERM
       ;

DECLARATION: VAR SYMBOL "=" TERM
           { $$ = yy.assign( $SYMBOL, $TERM); }
           ;

TERM: DEPLOYMENT
    | STRING
    { $$ = new yy.Var( $1, yy.Var.TYPE.STRING ); }
    | NUMBER
    { $$ = new yy.Var( $1, yy.Var.TYPE.NUMBER ); }
    | ADDRESS_CALL
    ;

ADDRESS_CALL: SYMBOL '.' SYMBOL OPT_CALL '(' ')'
            { $$ = yy.call( $1, $3, [], $4 ); }
            | SYMBOL '.' SYMBOL OPT_CALL '(' ARGS ')'
            { $$ = yy.call( $1, $3, $ARGS, $4 ); }
            ;


DEPLOYMENT: NEW SYMBOL "(" ")"
           { $$ = yy.deploy( $SYMBOL, [], {value: 0, gas:undefined} ); }
           
          | NEW SYMBOL "(" ARGS ")"
           { $$ = yy.deploy( $SYMBOL, $ARGS, {value: 0, gas:undefined} ); } 
           
          | NEW SYMBOL '.' OPT_CALL "(" ")"
           { $$ = yy.deploy( $SYMBOL, [], $OPT_CALL ); }
           
          | NEW SYMBOL '.' OPT_CALL "(" ARGS ")"
           { $$ = yy.deploy( $SYMBOL, $ARGS, $OPT_CALL ); }
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

