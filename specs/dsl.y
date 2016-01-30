/* description: Parses end evaluates mathematical expressions. */

/* lexical grammar */
%lex
%%
\s+                   {/* skip whitespace */}
"var"                 {return 'VAR';}
"new"                 {return 'NEW';}
"="                   {return '='}
"("                   {return '('}
")"                   {return ')'}
\w+                   {return 'WORD';}
<<EOF>>               {return 'EOF';}

/lex

/* operator associations and precedence */

%start seq

%% /* language grammar */

seq : s EOF
      {return $1;}
    | s s EOF
      {return $1 + '\n' + $2 }
    ;

s   : VAR WORD "=" NEW WORD '(' ')'  
      { return `creating new contract ${$5}`;  }
    ;
