set pagination off
break next_token
run audit/t1_int.c -o /tmp/t1s.s
define hook-stop
  if $pc == next_token
    set $hit = $hit + 1
    printf "Hit %d: rdi = %p\n", $hit, $rdi
    if $rdi == 0
      printf "*** NULL cc ***\n"
      backtrace 6
      set $dump = 1
    end
  end
end
set $hit = 0
set $dump = 0
continue
continue
continue
continue
continue
continue
continue
continue
continue
continue
quit
