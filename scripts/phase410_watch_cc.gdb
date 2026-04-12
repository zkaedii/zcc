set pagination off

# Break at entry of next_token
break next_token
run

# At entry: rbp is now set. -8(%rbp) is cc.
# Print its value — should be valid
printf "ENTRY: cc = %p\n", *(void**)($rbp - 8)

# Watch that exact address for any write
watch *(long*)($rbp - 8)

# Run until watchpoint fires (= something overwrites cc)
continue

# Print what wrote to it and from where
printf "AFTER WRITE: cc = %p\n", *(void**)($rbp - 8)
info registers rip rbp rsp rax r11
backtrace 5
x/5i $rip - 10

continue
