/* description: Parses end evaluates mathematical expressions. */

/* lexical grammar */
%lex
%%
\/\/[^\n]*\n          {/* skip comments */}
\s+                   {/* skip whitespace */}
"var"                 {return 'VAR';}
"log"                 {return 'LOG';}
"new"                 {return 'NEW';}
"export"              {return 'EXPORT'}
"import"              {return 'IMPORT'}
"value"               {return 'VALUE'}
"gas"                 {return 'GAS'}
"code"                {return 'CODE'}
"address"             {return 'ADDRESS'}
"at"                  {return 'AT'}
"=="                  {return 'EQ'}
"!="                  {return 'NEQ'}
">"                   {return 'GT'}
"<"                   {return 'LT'}
">="                  {return 'GTE'}
"<="                  {return 'LTE'}
"assert"              {return 'ASSERT'}
"true"                {return 'TRUE'}
"false"               {return 'FALSE'}
"="                   {return '='}
"("                   {return '('}
")"                   {return ')'}
"."                   {return '.'}
","                   {return ','}
\"([^\"]*)\"          {yytext = this.matches[1]; return 'STRING';}
\'([^\']*)\'          {yytext = this.matches[1]; return 'STRING';}
/* \d+.\d*               {yytext = parseFloat(yytext); return 'NUMBER';} */
\d+                   {yytext = parseInt(yytext); return 'NUMBER';}
\w+                   {return 'SYMBOL';}
<<EOF>>               {return 'EOF';}

/lex

/* operator associations and precedence */

%start DSL

%% /* language grammar */

DSL: FORMULAS
     { return $1; }
   | EOF
   ;

FORMULAS: FORMULA EOF
          { $$ = new yy.i.Expr( [$1], [], yy.i.TYPE.SEQ ); }
        | FORMULA FORMULAS
          { $2.value = [$1].concat( $2.value ); $$ = $2; }
        ;

FORMULA: ASSERTION
       | DECLARATION
       | EXPORT SYMBOL
       { $$ = new yy.i.Expr( yy.i.export, [$SYMBOL], yy.i.TYPE.EXPORT ) }
       | IMPORT SYMBOL
       { $$ = new yy.i.Expr( yy.i.import, [$SYMBOL], yy.i.TYPE.IMPORT ) }
       | TERM
       | LOG_STATEMENT
       ;

DECLARATION: VAR SYMBOL "=" TERM
           { $$ = new yy.i.Expr( yy.i.assign, [ $SYMBOL, $TERM ], yy.i.TYPE.ASSIGN ); }
           ;


ASSERTION: ASSERT COMPARISON
           { $$ = new yy.i.Expr( yy.i.assert, [$COMPARISON], yy.i.TYPE.ASSERTION ) }
         | ASSERT TERM
           { $$ = new yy.i.Expr( yy.i.assert, [$TERM], yy.i.TYPE.ASSERTION ) }
           ;

COMPARISON: TERM EQ TERM
            { $$ = new yy.i.Expr( yy.i.eq, [$1, $3], yy.i.TYPE.COMPARISON ) }
          | TERM NEQ TERM
            { $$ = new yy.i.Expr( yy.i.eq, [$1, $3], yy.i.TYPE.COMPARISON ) }
          | TERM GT TERM
            { $$ = new yy.i.Expr( yy.i.gt, [$1, $3], yy.i.TYPE.COMPARISON ) }
          | TERM LT TERM
            { $$ = new yy.i.Expr( yy.i.lt, [$1, $3], yy.i.TYPE.COMPARISON ) }
          | TERM GTE TERM
            { $$ = new yy.i.Expr( yy.i.gte, [$1, $3], yy.i.TYPE.COMPARISON ) }
          | TERM LTE TERM
            { $$ = new yy.i.Expr( yy.i.lte, [$1, $3], yy.i.TYPE.COMPARISON ) }
          ;

LOG_STATEMENT: LOG TERM
               { $$ = new yy.i.Expr( yy.i.log_atom, [$TERM], yy.i.TYPE.LOG ) }
               ;

BOOLEAN: TRUE
         { $$ = new yy.i.Expr( true, [], yy.i.TYPE.BOOLEAN ); }
       | FALSE
         { $$ = new yy.i.Expr( false, [], yy.i.TYPE.BOOLEAN ); }
       ;

TERM: DEPLOYMENT
    | STRING
    { $$ = new yy.i.Expr( $1, [], yy.i.TYPE.STRING ); }
    | NUMBER
    { $$ = new yy.i.Expr( $1, [], yy.i.TYPE.NUMBER ); }
    | BOOLEAN
    | ADDRESS_CALL
    | CONTRACT_AT
    | REFERENCE
    | GET_CODE
    | GET_ADDRESS
    ;

GET_CODE: CODE '(' TERM ')'
          { $$ = new yy.i.Expr( yy.i.getCode, [$3], yy.i.TYPE.GET_CODE ); }
          ;

GET_ADDRESS: ADDRESS '(' REFERENCE ')'
             { $$ = new yy.i.Expr( yy.i.getAddress, [$3], yy.i.TYPE.GET_ADDRESS ); }
             ;

CONTRACT_AT: SYMBOL '(' TERM ')'
             { $$ = new yy.i.Expr( yy.i.contractAt, [$1, $3], yy.i.TYPE.GET_CONTRACT ); }
             ;

ADDRESS_CALL: REFERENCE '.' SYMBOL '(' ')'
            { $$ = new yy.i.Expr( yy.i.call, [$1, $3, [], { value: 0, gas: undefined }], yy.i.TYPE.CALL ); }
            | REFERENCE '.'SYMBOL '(' ARGS ')'
            { $$ = new yy.i.Expr( yy.i.call, [$1, $3, $ARGS, { value: 0, gas: undefined }], yy.i.TYPE.CALL ); }
            | REFERENCE '.' SYMBOL '.' OPT_CALL '(' ')'
            { $$ = new yy.i.Expr( yy.i.call, [$1, $3, [], $OPT_CALL], yy.i.TYPE.CALL ); }
            | REFERENCE '.'SYMBOL '.' OPT_CALL '(' ARGS ')'
            { $$ = new yy.i.Expr( yy.i.call, [$1, $3, $ARGS, $OPT_CALL], yy.i.TYPE.CALL ); }
            ;


DEPLOYMENT: NEW SYMBOL "(" ")"
          { $$ = new yy.i.Expr( yy.i.deploy, [ $SYMBOL, [], {value: 0, gas:undefined} ], yy.i.TYPE.DEPLOY ); }
          | NEW SYMBOL "(" ARGS ")"
          { $$ = new yy.i.Expr( yy.i.deploy, [ $SYMBOL, $ARGS, {value: 0, gas:undefined} ], yy.i.TYPE.DEPLOY ); }
          | NEW SYMBOL '.' OPT_CALL "(" ")"
          { $$ = new yy.i.Expr( yy.i.deploy, [ $SYMBOL, [], $OPT_CALL ], yy.i.TYPE.DEPLOY ); }
          | NEW SYMBOL '.' OPT_CALL "(" ARGS ")"
          { $$ = new yy.i.Expr( yy.i.deploy, [ $SYMBOL, $ARGS, $OPT_CALL ], yy.i.TYPE.DEPLOY ); }
          ;

OPT_CALL:
        | VALUE '(' NUMBER ')'
        { $$ = {value: $NUMBER, gas: undefined}; }
        | VALUE '(' NUMBER ')' '.' OPT_CALL
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

REFERENCE: SYMBOL
      { $$ = new yy.i.Expr( $1, [], yy.i.TYPE.REFERENCE ); }
      ;

