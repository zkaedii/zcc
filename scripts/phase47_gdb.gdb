set pagination off
break next_token
run
printf "Hit 1: rdi = %p\n", (void*)$rdi
continue
printf "Hit 2: rdi = %p\n", (void*)$rdi
backtrace
info registers rdi rbp rsp
x/1gx $rbp-24
continue
