#ifndef _MATH_H
#define _MATH_H
#define HUGE_VAL     (1.0/0.0)
#define HUGE_VALF    (1.0f/0.0f)
#define INFINITY     (1.0f/0.0f)
#define NAN          (0.0f/0.0f)
double pow(double x, double y);
double sqrt(double x);
double sin(double x);
double cos(double x);
double tan(double x);
double asin(double x);
double acos(double x);
double atan(double x);
double atan2(double y, double x);
double exp(double x);
double log(double x);
double log2(double x);
double log10(double x);
double floor(double x);
double ceil(double x);
double fabs(double x);
double fmod(double x, double y);
double modf(double x, double *iptr);
double frexp(double x, int *exp);
double ldexp(double x, int exp);
double sinh(double x);
double cosh(double x);
double tanh(double x);
int    isnan(double x);
int    isinf(double x);
int    isfinite(double x);
#endif
