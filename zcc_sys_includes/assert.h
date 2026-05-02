#ifndef _ASSERT_H
#define _ASSERT_H
#ifdef NDEBUG
#define assert(x) ((void)0)
#else
#define assert(x) ((void)(x))
#endif
#endif
