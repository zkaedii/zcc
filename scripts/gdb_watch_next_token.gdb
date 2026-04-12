set pagination off
break next_token
commands
silent
if $rdi == 0
  printf "*** next_token(cc) with cc=NULL ***\n"
  backtrace 5
else
  printf "rdi=%p\n", $rdi
end
continue
end
run audit/t1_int.c -o /tmp/t1s.s
quit
