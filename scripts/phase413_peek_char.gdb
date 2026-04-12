set pagination off
break peek_char
run
continue
continue
continue
continue
continue
continue
# At each peek_char hit: if rdi looks like a pointer, continue; else report bad call
while 1
  if $rdi > 0x10000
    continue
  end
  printf "BAD CALL: rdi=%lld (0x%llx)\n", $rdi, $rdi
  backtrace 4
  # Show instructions at caller (next_token) before the call
  frame 1
  x/20i $rip - 30
  info registers rdi rsi rbp rsp
  quit
end
quit
