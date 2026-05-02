#ifndef _ZCC_ERRNO_H
#define _ZCC_ERRNO_H

extern int *__errno_location(void);
#define errno (*__errno_location())

#define EINTR   4
#define EAGAIN  11
#define ENOMEM  12
#define EACCES  13
#define EEXIST  17
#define ENOTDIR 20
#define EISDIR  21
#define EINVAL  22
#define ENOSPC  28
#define ERANGE  34
#define ENOENT  2

#endif
