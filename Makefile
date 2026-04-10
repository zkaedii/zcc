CC = gcc
CFLAGS = -O0 -w -fno-asynchronous-unwind-tables
LDFLAGS = -lm

PARTS = part1.c part0_pp.c part2.c part3.c ir.h ir_emit_dispatch.h ir_bridge.h part4.c part5.c ir.c ir_to_x86.c
PASSES = compiler_passes.c compiler_passes_ir.c

.PHONY: all clean selfhost test

all: zcc

zcc.c: $(PARTS)
	cat $(PARTS) > zcc.c

zcc: zcc.c $(PASSES)
	$(CC) $(CFLAGS) -o zcc zcc.c $(PASSES) $(LDFLAGS)

selfhost: zcc
	@echo "=== Stage 1: zcc compiles itself ==="
	./zcc zcc.c -o zcc2.s
	$(CC) $(CFLAGS) -o zcc2 zcc2.s $(PASSES) $(LDFLAGS)
	@echo "=== Stage 2: zcc2 compiles itself ==="
	./zcc2 zcc.c -o zcc3.s
	@echo "=== Verify: zcc2.s == zcc3.s ==="
	cmp zcc2.s zcc3.s && echo "SELF-HOST VERIFIED" || echo "SELF-HOST FAILED"

test: zcc
	bash zcc_test_suite.sh --quick

asan: zcc.c $(PASSES)
	$(CC) -fsanitize=address -O0 -g -o zcc_asan zcc.c $(PASSES) $(LDFLAGS)
	@echo "ASan build ready. Run: ./zcc_asan zcc.c -o /dev/null"

clean:
	rm -f zcc zcc2 zcc3 zcc_asan zcc.c zcc_pp.c *.s *.o

ir-verify: zcc2
	@echo "[IR-VERIFY] Stage 2 IR emission..."
	ZCC_EMIT_IR=1 ./zcc2 zcc.c -o zcc_ir_stage2.s
	@echo "[IR-VERIFY] Linking IR stage 2 binary..."
	gcc zcc_ir_stage2.s compiler_passes.c compiler_passes_ir.c -o zcc_ir_stage2 -lm
	@echo "[IR-VERIFY] Stage 3 via IR path..."
	ZCC_EMIT_IR=1 ./zcc_ir_stage2 zcc.c -o zcc_ir_stage3.s

sqlite: zcc2
	@echo "=== Compiling SQLite 160MB Amalgamation with ZCC ==="
	./zcc2 sqlite3_zcc.c -o sqlite3
	@echo "=== Build Complete ==="
