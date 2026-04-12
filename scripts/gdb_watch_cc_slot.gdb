set pagination off
break main
run audit/t1_int.c -o /tmp/t1s.s
step 6
# Now rbp is main's frame; -24 is cc slot
set $main_cc_slot = $rbp - 24
watch *(long*)($main_cc_slot)
continue
continue
continue
continue
continue
info registers rip
x/1i $rip
backtrace 3
quit
