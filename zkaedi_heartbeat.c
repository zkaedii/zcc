// zkaedi_heartbeat.c
// The sacred pulse of ZCC PRIME.

#include <stdio.h>
#include <stdint.h>
#include <time.h>

static uint64_t oracle_cycles = 0;
static uint64_t parity_locks = 0;
static uint64_t observed_events = 0;
static uint64_t rollback_events = 0;

void zkaedi_heartbeat_tick(
    int parity_locked,
    int observed,
    int rollback
) {
    oracle_cycles++;

    if (parity_locked) parity_locks++;
    if (observed) observed_events++;
    if (rollback) rollback_events++;

    if ((oracle_cycles % 1024) == 0) {
        time_t t = time(NULL);

        fprintf(stderr,
            "\n"
            "═══════════════════════════════════════\n"
            " ZKAEDI PRIME HEARTBEAT\n"
            "═══════════════════════════════════════\n"
            " cycles     : %llu\n"
            " parity     : %llu\n"
            " observed   : %llu\n"
            " rollback   : %llu\n"
            " stability  : %.4f\n"
            " timestamp  : %lld\n"
            "═══════════════════════════════════════\n",
            (unsigned long long)oracle_cycles,
            (unsigned long long)parity_locks,
            (unsigned long long)observed_events,
            (unsigned long long)rollback_events,
            oracle_cycles ?
                ((double)parity_locks / (double)oracle_cycles) : 1.0,
            (long long)t
        );
    }
}
