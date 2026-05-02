/* zcc-level3: ar-lite — simple file archiver
 * Archive format: sequence of entries:
 *   [16 bytes: filename, null-padded]
 *   [8 bytes: file size as ASCII decimal, null-padded]
 *   [N bytes: file data]
 *
 * Usage:
 *   ar-lite c archive.ar file1 file2 ...   (create)
 *   ar-lite t archive.ar                    (list)
 *   ar-lite x archive.ar                    (extract)
 */
#include <stdio.h>
#include <string.h>

int ar_create(char *archive, int nfiles, char **files) {
    FILE *out;
    FILE *in;
    char name_buf[16];
    char size_buf[8];
    long fsize;
    int ch;
    int i;
    int j;
    int len;

    out = fopen(archive, "wb");
    if (!out) {
        fprintf(stderr, "ar-lite: cannot create '%s'\n", archive);
        return 1;
    }

    i = 0;
    while (i < nfiles) {
        /* open input file */
        in = fopen(files[i], "rb");
        if (!in) {
            fprintf(stderr, "ar-lite: cannot open '%s'\n", files[i]);
            fclose(out);
            return 1;
        }

        /* get file size */
        fsize = 0;
        ch = fgetc(in);
        while (ch != (-1)) {
            fsize = fsize + 1;
            ch = fgetc(in);
        }

        /* rewind - manual since ZCC may not have fseek */
        fclose(in);
        in = fopen(files[i], "rb");
        if (!in) {
            fclose(out);
            return 1;
        }

        /* write name header (16 bytes, null-padded) */
        j = 0;
        while (j < 16) {
            name_buf[j] = '\0';
            j = j + 1;
        }

        /* extract basename */
        len = strlen(files[i]);
        j = len - 1;
        while (j >= 0 && files[i][j] != '/' && files[i][j] != '\\')
            j = j - 1;
        j = j + 1;

        len = 0;
        while (files[i][j + len] != '\0' && len < 15) {
            name_buf[len] = files[i][j + len];
            len = len + 1;
        }

        fwrite(name_buf, 1, 16, out);

        /* write size header (8 bytes, ASCII decimal, null-padded) */
        j = 0;
        while (j < 8) {
            size_buf[j] = '\0';
            j = j + 1;
        }

        /* convert size to ASCII */
        if (fsize == 0) {
            size_buf[0] = '0';
        } else {
            char tmp[8];
            int ti;
            long s;

            ti = 0;
            s = fsize;
            while (s > 0 && ti < 7) {
                tmp[ti] = '0' + (s % 10);
                s = s / 10;
                ti = ti + 1;
            }
            /* reverse */
            j = 0;
            while (ti > 0) {
                ti = ti - 1;
                size_buf[j] = tmp[ti];
                j = j + 1;
            }
        }

        fwrite(size_buf, 1, 8, out);

        /* write file data */
        ch = fgetc(in);
        while (ch != (-1)) {
            fputc(ch, out);
            ch = fgetc(in);
        }

        fclose(in);
        i = i + 1;
    }

    fclose(out);
    return 0;
}

int ar_list(char *archive) {
    FILE *f;
    char name_buf[16];
    char size_buf[8];
    long fsize;
    int n;
    int i;
    int ch;

    f = fopen(archive, "rb");
    if (!f) {
        fprintf(stderr, "ar-lite: cannot open '%s'\n", archive);
        return 1;
    }

    while (1) {
        /* read name header */
        n = 0;
        while (n < 16) {
            ch = fgetc(f);
            if (ch == (-1)) {
                fclose(f);
                return 0;
            }
            name_buf[n] = ch;
            n = n + 1;
        }

        /* read size header */
        n = 0;
        while (n < 8) {
            ch = fgetc(f);
            if (ch == (-1)) {
                fclose(f);
                return 1;
            }
            size_buf[n] = ch;
            n = n + 1;
        }

        /* parse size */
        fsize = 0;
        i = 0;
        while (i < 8 && size_buf[i] >= '0' && size_buf[i] <= '9') {
            fsize = fsize * 10 + (size_buf[i] - '0');
            i = i + 1;
        }

        printf("%8ld %s\n", fsize, name_buf);

        /* skip file data */
        while (fsize > 0) {
            ch = fgetc(f);
            if (ch == (-1)) break;
            fsize = fsize - 1;
        }
    }

    fclose(f);
    return 0;
}

int ar_extract(char *archive) {
    FILE *f;
    FILE *out;
    char name_buf[16];
    char size_buf[8];
    long fsize;
    int n;
    int i;
    int ch;

    f = fopen(archive, "rb");
    if (!f) {
        fprintf(stderr, "ar-lite: cannot open '%s'\n", archive);
        return 1;
    }

    while (1) {
        /* read name header */
        n = 0;
        while (n < 16) {
            ch = fgetc(f);
            if (ch == (-1)) {
                fclose(f);
                return 0;
            }
            name_buf[n] = ch;
            n = n + 1;
        }

        /* read size header */
        n = 0;
        while (n < 8) {
            ch = fgetc(f);
            if (ch == (-1)) {
                fclose(f);
                return 1;
            }
            size_buf[n] = ch;
            n = n + 1;
        }

        /* parse size */
        fsize = 0;
        i = 0;
        while (i < 8 && size_buf[i] >= '0' && size_buf[i] <= '9') {
            fsize = fsize * 10 + (size_buf[i] - '0');
            i = i + 1;
        }

        /* extract */
        printf("x %s (%ld bytes)\n", name_buf, fsize);

        out = fopen(name_buf, "wb");
        if (!out) {
            fprintf(stderr, "ar-lite: cannot create '%s'\n", name_buf);
            fclose(f);
            return 1;
        }

        while (fsize > 0) {
            ch = fgetc(f);
            if (ch == (-1)) break;
            fputc(ch, out);
            fsize = fsize - 1;
        }

        fclose(out);
    }

    fclose(f);
    return 0;
}

int main(int argc, char **argv) {
    if (argc < 3) {
        fprintf(stderr, "usage: ar-lite [c|t|x] archive [files...]\n");
        return 1;
    }

    if (argv[1][0] == 'c') {
        if (argc < 4) {
            fprintf(stderr, "ar-lite: create needs files\n");
            return 1;
        }
        return ar_create(argv[2], argc - 3, argv + 3);
    }

    if (argv[1][0] == 't') {
        return ar_list(argv[2]);
    }

    if (argv[1][0] == 'x') {
        return ar_extract(argv[2]);
    }

    fprintf(stderr, "ar-lite: unknown command '%c'\n", argv[1][0]);
    return 1;
}
