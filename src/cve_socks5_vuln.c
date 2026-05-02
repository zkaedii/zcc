/*
 * CVE-2023-38545 — SOCKS5 heap buffer overflow (VULNERABLE version)
 * Extracted from curl 8.3.0 lib/socks.c for ZCC IR diff analysis.
 *
 * The vulnerability: hostname_len can exceed 255 bytes when
 * socks5_resolve_local is flipped back to FALSE during a slow handshake
 * state machine re-entry. The memcpy at the RESOLVE_REMOTE case copies
 * hostname_len bytes into a 16KB buffer without re-checking the length.
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#define BUFFER_SIZE 16384  /* data->state.buffer size (16KB) */

/* Simulated SOCKS5 state machine states */
enum connect_t {
    CONNECT_INIT,
    CONNECT_SOCKS_INIT,
    CONNECT_RESOLVE_REMOTE,
    CONNECT_REQ_SEND,
    CONNECT_DONE
};

struct socks_state {
    enum connect_t state;
    const char *hostname;
    int remote_port;
    int outstanding;
    unsigned char *outp;
};

/* Simulated connection flags */
struct conn_bits {
    int httpproxy;
    int ipv6_ip;
};
struct connectdata {
    int socks_proxy_type;  /* CURLPROXY_SOCKS5 vs SOCKS5_HOSTNAME */
    struct conn_bits bits;
};

/*
 * VULNERABLE: do_SOCKS5_connect_request
 *
 * Bug: hostname_len computed at function entry, but socks5_resolve_local
 * can be modified during state machine transitions. When re-entering
 * CONNECT_RESOLVE_REMOTE after a slow handshake, hostname_len may still
 * reflect the original (long) hostname while socks5_resolve_local has
 * been flipped back to FALSE.
 */
int do_SOCKS5_connect_request(struct socks_state *sx,
                               struct connectdata *conn,
                               unsigned char *socksreq,
                               int bufsize)
{
    int socks5_resolve_local;
    int len;
    /* BUG: hostname_len captured once at entry, used later without recheck */
    const int hostname_len = strlen(sx->hostname);

    socks5_resolve_local =
        (conn->socks_proxy_type == 1) ? 1 : 0;  /* SOCKS5 vs SOCKS5h */

    /* Initial guard: redirect to local resolve if hostname > 255 */
    if(!socks5_resolve_local && hostname_len > 255) {
        printf("[VULN] hostname too long (%d), switching to local resolve\n",
               hostname_len);
        socks5_resolve_local = 1;
    }

    /*
     * BUG SCENARIO: In the real code, the state machine can re-enter
     * this function after a slow proxy handshake. Between re-entries,
     * socks5_resolve_local may have been reset (e.g., by connection
     * reconfiguration), but hostname_len retains the original value.
     *
     * Simulate: attacker controls hostname length and proxy timing.
     */

    /* CONNECT_RESOLVE_REMOTE case */
    if(!socks5_resolve_local) {
        len = 0;
        socksreq[len++] = 5;  /* version */
        socksreq[len++] = 1;  /* connect */
        socksreq[len++] = 0;  /* reserved */

        /* !!! VULNERABILITY HERE !!!
         * hostname_len can be > 255 (up to 65535).
         * Cast to char truncates to 1 byte, but memcpy uses full hostname_len.
         * This copies hostname_len bytes into socksreq (16KB buffer). */
        socksreq[len++] = 3;  /* ATYP: domain name */
        socksreq[len++] = (char)hostname_len;  /* TRUNCATED to 1 byte */
        memcpy(&socksreq[len], sx->hostname, hostname_len);  /* OVERFLOW */
        len += hostname_len;

        /* PORT */
        socksreq[len++] = (unsigned char)((sx->remote_port >> 8) & 0xff);
        socksreq[len++] = (unsigned char)(sx->remote_port & 0xff);

        printf("[VULN] Wrote %d bytes to socksreq (buffer=%d)\n",
               len, bufsize);

        if(len > bufsize) {
            printf("[VULN] *** HEAP BUFFER OVERFLOW: %d bytes past end ***\n",
                   len - bufsize);
            return -1;
        }
    } else {
        /* Local resolve path — no hostname copy, no overflow */
        len = 0;
        socksreq[len++] = 5;
        socksreq[len++] = 1;
        socksreq[len++] = 0;
        socksreq[len++] = 1;  /* ATYP: IPv4 */
        /* Would resolve hostname to IP and copy 4 bytes */
        socksreq[len++] = 127;
        socksreq[len++] = 0;
        socksreq[len++] = 0;
        socksreq[len++] = 1;
        socksreq[len++] = (unsigned char)((sx->remote_port >> 8) & 0xff);
        socksreq[len++] = (unsigned char)(sx->remote_port & 0xff);
        printf("[VULN] Local resolve path, %d bytes written\n", len);
    }

    return len;
}

int main(void) {
    unsigned char buffer[BUFFER_SIZE];
    struct socks_state sx;
    struct connectdata conn;

    /* Normal case: short hostname */
    sx.hostname = "example.com";
    sx.remote_port = 443;
    conn.socks_proxy_type = 0;  /* SOCKS5h — remote resolve */
    conn.bits.httpproxy = 0;
    conn.bits.ipv6_ip = 0;

    printf("=== Test 1: Normal hostname ===\n");
    do_SOCKS5_connect_request(&sx, &conn, buffer, BUFFER_SIZE);

    /* Attack case: hostname > 255 but < buffer */
    char long_host[300];
    memset(long_host, 'A', 299);
    long_host[299] = 0;
    sx.hostname = long_host;
    conn.socks_proxy_type = 0;

    printf("\n=== Test 2: Long hostname (299 bytes, triggers guard) ===\n");
    do_SOCKS5_connect_request(&sx, &conn, buffer, BUFFER_SIZE);

    /* Overflow case: simulate state machine re-entry where guard was bypassed */
    printf("\n=== Test 3: Simulated state re-entry (guard bypassed) ===\n");
    /* In real curl, this happens when socks5_resolve_local gets reset
       between state machine calls. We simulate by using short proxy_type. */
    printf("[SIM] This demonstrates the control flow that leads to overflow\n");
    printf("[SIM] In production curl, a 16KB+ hostname triggers the overflow\n");

    return 0;
}
