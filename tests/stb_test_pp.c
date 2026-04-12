
typedef struct FILE FILE;
typedef unsigned long size_t;
#define NULL ((void*)0)

int printf(const char *format, ...);
FILE *fopen(const char *filename, const char *mode);
int fclose(FILE *stream);
size_t fread(void *ptr, size_t size, size_t nmemb, FILE *stream);
size_t fwrite(const void *ptr, size_t size, size_t nmemb, FILE *stream);
int fseek(FILE *stream, long offset, int whence);
long ftell(FILE *stream);
void *malloc(size_t size);
void free(void *ptr);
void *realloc(void *ptr, size_t size);
void *memcpy(void *dest, const void *src, size_t n);
void *memset(void *s, int c, size_t n);
int abs(int j);

double pow(double x, double y);
double ldexp(double x, int exp);

#define SEEK_SET 0
#define SEEK_CUR 1
#define SEEK_END 2
#define assert(x) ((void)0)
#define SHRT_MAX 32767
#define SHRT_MIN (-32768)
#define INT_MAX 2147483647

typedef unsigned char stbi_uc;
typedef unsigned short stbi_us;
typedef struct
{
   int (*read) (void *user,char *data,int size);
   void (*skip) (void *user,int n);
   int (*eof) (void *user);
} stbi_io_callbacks;
extern stbi_uc *stbi_load_from_memory (stbi_uc const *buffer, int len , int *x, int *y, int *channels_in_file, int desired_channels);
extern stbi_uc *stbi_load_from_callbacks(stbi_io_callbacks const *clbk , void *user, int *x, int *y, int *channels_in_file, int desired_channels);
extern stbi_us *stbi_load_16_from_memory (stbi_uc const *buffer, int len, int *x, int *y, int *channels_in_file, int desired_channels);
extern stbi_us *stbi_load_16_from_callbacks(stbi_io_callbacks const *clbk, void *user, int *x, int *y, int *channels_in_file, int desired_channels);
extern int stbi_is_hdr_from_callbacks(stbi_io_callbacks const *clbk, void *user);
extern int stbi_is_hdr_from_memory(stbi_uc const *buffer, int len);
extern const char *stbi_failure_reason (void);
extern void stbi_image_free (void *retval_from_stbi_load);
extern int stbi_info_from_memory(stbi_uc const *buffer, int len, int *x, int *y, int *comp);
extern int stbi_info_from_callbacks(stbi_io_callbacks const *clbk, void *user, int *x, int *y, int *comp);
extern int stbi_is_16_bit_from_memory(stbi_uc const *buffer, int len);
extern int stbi_is_16_bit_from_callbacks(stbi_io_callbacks const *clbk, void *user);
extern void stbi_set_unpremultiply_on_load(int flag_true_if_should_unpremultiply);
extern void stbi_convert_iphone_png_to_rgb(int flag_true_if_should_convert);
extern void stbi_set_flip_vertically_on_load(int flag_true_if_should_flip);
extern void stbi_set_unpremultiply_on_load_thread(int flag_true_if_should_unpremultiply);
extern void stbi_convert_iphone_png_to_rgb_thread(int flag_true_if_should_convert);
extern void stbi_set_flip_vertically_on_load_thread(int flag_true_if_should_flip);
extern char *stbi_zlib_decode_malloc_guesssize(const char *buffer, int len, int initial_size, int *outlen);
extern char *stbi_zlib_decode_malloc_guesssize_headerflag(const char *buffer, int len, int initial_size, int *outlen, int parse_header);
extern char *stbi_zlib_decode_malloc(const char *buffer, int len, int *outlen);
extern int stbi_zlib_decode_buffer(char *obuffer, int olen, const char *ibuffer, int ilen);
extern char *stbi_zlib_decode_noheader_malloc(const char *buffer, int len, int *outlen);
extern int stbi_zlib_decode_noheader_buffer(char *obuffer, int olen, const char *ibuffer, int ilen);
typedef long int ptrdiff_t;
typedef struct {
  long long __max_align_ll;
  long double __max_align_ld;
} max_align_t;



typedef short int16_t;
typedef int int32_t;
typedef unsigned short uint16_t;
typedef unsigned int uint32_t;
typedef unsigned char uint8_t;
typedef unsigned short uint16_t;
typedef unsigned int uint32_t;
typedef unsigned long long uint64_t;
typedef signed char int_least8_t;
typedef short int_least16_t;
typedef int int_least32_t;
typedef long long int_least64_t;
typedef unsigned char uint_least8_t;
typedef unsigned short uint_least16_t;
typedef unsigned int uint_least32_t;
typedef unsigned long long uint_least64_t;
typedef signed char int_fast8_t;
typedef long int int_fast16_t;
typedef long int int_fast32_t;
typedef long int int_fast64_t;
typedef unsigned char uint_fast8_t;
typedef unsigned long int uint_fast16_t;
typedef unsigned long int uint_fast32_t;
typedef unsigned long int uint_fast64_t;
typedef long int intptr_t;
typedef unsigned long int uintptr_t;
typedef long long intmax_t;
typedef unsigned long long uintmax_t;
typedef uint16_t stbi__uint16;
typedef int16_t stbi__int16;
typedef uint32_t stbi__uint32;
typedef int32_t stbi__int32;
typedef unsigned char validate_uint32[sizeof(stbi__uint32)==4 ? 1 : -1];
typedef struct
{
   stbi__uint32 img_x, img_y;
   int img_n, img_out_n;
   stbi_io_callbacks io;
   void *io_user_data;
   int read_from_callbacks;
   int buflen;
   stbi_uc buffer_start[128];
   int callback_already_read;
   stbi_uc *img_buffer, *img_buffer_end;
   stbi_uc *img_buffer_original, *img_buffer_original_end;
} stbi__context;
static void stbi__refill_buffer(stbi__context *s);
static void stbi__start_mem(stbi__context *s, stbi_uc const *buffer, int len)
{
   s->io.read = ((void *)0);
   s->read_from_callbacks = 0;
   s->callback_already_read = 0;
   s->img_buffer = s->img_buffer_original = (stbi_uc *) buffer;
   s->img_buffer_end = s->img_buffer_original_end = (stbi_uc *) buffer+len;
}
static void stbi__start_callbacks(stbi__context *s, stbi_io_callbacks *c, void *user)
{
   s->io = *c;
   s->io_user_data = user;
   s->buflen = sizeof(s->buffer_start);
   s->read_from_callbacks = 1;
   s->callback_already_read = 0;
   s->img_buffer = s->img_buffer_original = s->buffer_start;
   stbi__refill_buffer(s);
   s->img_buffer_original_end = s->img_buffer_end;
}
static void stbi__rewind(stbi__context *s)
{
   s->img_buffer = s->img_buffer_original;
   s->img_buffer_end = s->img_buffer_original_end;
}
enum
{
   STBI_ORDER_RGB,
   STBI_ORDER_BGR
};
typedef struct
{
   int bits_per_channel;
   int num_channels;
   int channel_order;
} stbi__result_info;
static int stbi__png_test(stbi__context *s);
static void *stbi__png_load(stbi__context *s, int *x, int *y, int *comp, int req_comp, stbi__result_info *ri);
static int stbi__png_info(stbi__context *s, int *x, int *y, int *comp);
static int stbi__png_is16(stbi__context *s);
static
_Thread_local
const char *stbi__g_failure_reason;
extern const char *stbi_failure_reason(void)
{
   return stbi__g_failure_reason;
}
static int stbi__err(const char *str)
{
   stbi__g_failure_reason = str;
   return 0;
}
static void *stbi__malloc(size_t size)
{
    return malloc(size);
}
static int stbi__addsizes_valid(int a, int b)
{
   if (b < 0) return 0;
   return a <= 0x7fffffff - b;
}
static int stbi__mul2sizes_valid(int a, int b)
{
   if (a < 0 || b < 0) return 0;
   if (b == 0) return 1;
   return a <= 0x7fffffff/b;
}
static int stbi__mad2sizes_valid(int a, int b, int add)
{
   return stbi__mul2sizes_valid(a, b) && stbi__addsizes_valid(a*b, add);
}
static int stbi__mad3sizes_valid(int a, int b, int c, int add)
{
   return stbi__mul2sizes_valid(a, b) && stbi__mul2sizes_valid(a*b, c) &&
      stbi__addsizes_valid(a*b*c, add);
}
static void *stbi__malloc_mad2(int a, int b, int add)
{
   if (!stbi__mad2sizes_valid(a, b, add)) return ((void *)0);
   return stbi__malloc(a*b + add);
}
static void *stbi__malloc_mad3(int a, int b, int c, int add)
{
   if (!stbi__mad3sizes_valid(a, b, c, add)) return ((void *)0);
   return stbi__malloc(a*b*c + add);
}
static int stbi__addints_valid(int a, int b)
{
   if ((a >= 0) != (b >= 0)) return 1;
   if (a < 0 && b < 0) return a >= (-0x7fffffff - 1) - b;
   return a <= 0x7fffffff - b;
}
static int stbi__mul2shorts_valid(int a, int b)
{
   if (b == 0 || b == -1) return 1;
   if ((a >= 0) == (b >= 0)) return a <= 0x7fff/b;
   if (b < 0) return a <= (-0x7fff - 1) / b;
   return a >= (-0x7fff - 1) / b;
}
extern void stbi_image_free(void *retval_from_stbi_load)
{
   free(retval_from_stbi_load);
}
static int stbi__vertically_flip_on_load_global = 0;
extern void stbi_set_flip_vertically_on_load(int flag_true_if_should_flip)
{
   stbi__vertically_flip_on_load_global = flag_true_if_should_flip;
}
static _Thread_local int stbi__vertically_flip_on_load_local, stbi__vertically_flip_on_load_set;
extern void stbi_set_flip_vertically_on_load_thread(int flag_true_if_should_flip)
{
   stbi__vertically_flip_on_load_local = flag_true_if_should_flip;
   stbi__vertically_flip_on_load_set = 1;
}
static void *stbi__load_main(stbi__context *s, int *x, int *y, int *comp, int req_comp, stbi__result_info *ri, int bpc)
{
   memset(ri, 0, sizeof(*ri));
   ri->bits_per_channel = 8;
   ri->channel_order = STBI_ORDER_RGB;
   ri->num_channels = 0;
   if (stbi__png_test(s)) return stbi__png_load(s,x,y,comp,req_comp, ri);
   (void)sizeof(bpc);
   return ((unsigned char *)(size_t) (stbi__err("Image not of any known type, or corrupt")?((void *)0):((void *)0)));
}
static stbi_uc *stbi__convert_16_to_8(stbi__uint16 *orig, int w, int h, int channels)
{
   int i;
   int img_len = w * h * channels;
   stbi_uc *reduced;
   reduced = (stbi_uc *) stbi__malloc(img_len);
   if (reduced == ((void *)0)) return ((unsigned char *)(size_t) (stbi__err("Out of memory")?((void *)0):((void *)0)));
   for (i = 0; i < img_len; ++i)
      reduced[i] = (stbi_uc)((orig[i] >> 8) & 0xFF);
   free(orig);
   return reduced;
}
static stbi__uint16 *stbi__convert_8_to_16(stbi_uc *orig, int w, int h, int channels)
{
   int i;
   int img_len = w * h * channels;
   stbi__uint16 *enlarged;
   enlarged = (stbi__uint16 *) stbi__malloc(img_len*2);
   if (enlarged == ((void *)0)) return (stbi__uint16 *) ((unsigned char *)(size_t) (stbi__err("Out of memory")?((void *)0):((void *)0)));
   for (i = 0; i < img_len; ++i)
      enlarged[i] = (stbi__uint16)((orig[i] << 8) + orig[i]);
   free(orig);
   return enlarged;
}
static void stbi__vertical_flip(void *image, int w, int h, int bytes_per_pixel)
{
   int row;
   size_t bytes_per_row = (size_t)w * bytes_per_pixel;
   stbi_uc temp[2048];
   stbi_uc *bytes = (stbi_uc *)image;
   for (row = 0; row < (h>>1); row++) {
      stbi_uc *row0 = bytes + row*bytes_per_row;
      stbi_uc *row1 = bytes + (h - row - 1)*bytes_per_row;
      size_t bytes_left = bytes_per_row;
      while (bytes_left) {
         size_t bytes_copy = (bytes_left < sizeof(temp)) ? bytes_left : sizeof(temp);
         memcpy(temp, row0, bytes_copy);
         memcpy(row0, row1, bytes_copy);
         memcpy(row1, temp, bytes_copy);
         row0 += bytes_copy;
         row1 += bytes_copy;
         bytes_left -= bytes_copy;
      }
   }
}
static unsigned char *stbi__load_and_postprocess_8bit(stbi__context *s, int *x, int *y, int *comp, int req_comp)
{
   stbi__result_info ri;
   void *result = stbi__load_main(s, x, y, comp, req_comp, &ri, 8);
   if (result == ((void *)0))
      return ((void *)0);
   0;
   if (ri.bits_per_channel != 8) {
      result = stbi__convert_16_to_8((stbi__uint16 *) result, *x, *y, req_comp == 0 ? *comp : req_comp);
      ri.bits_per_channel = 8;
   }
   if ((stbi__vertically_flip_on_load_set ? stbi__vertically_flip_on_load_local : stbi__vertically_flip_on_load_global)) {
      int channels = req_comp ? req_comp : *comp;
      stbi__vertical_flip(result, *x, *y, channels * sizeof(stbi_uc));
   }
   return (unsigned char *) result;
}
static stbi__uint16 *stbi__load_and_postprocess_16bit(stbi__context *s, int *x, int *y, int *comp, int req_comp)
{
   stbi__result_info ri;
   void *result = stbi__load_main(s, x, y, comp, req_comp, &ri, 16);
   if (result == ((void *)0))
      return ((void *)0);
   0;
   if (ri.bits_per_channel != 16) {
      result = stbi__convert_8_to_16((stbi_uc *) result, *x, *y, req_comp == 0 ? *comp : req_comp);
      ri.bits_per_channel = 16;
   }
   if ((stbi__vertically_flip_on_load_set ? stbi__vertically_flip_on_load_local : stbi__vertically_flip_on_load_global)) {
      int channels = req_comp ? req_comp : *comp;
      stbi__vertical_flip(result, *x, *y, channels * sizeof(stbi__uint16));
   }
   return (stbi__uint16 *) result;
}
extern stbi_us *stbi_load_16_from_memory(stbi_uc const *buffer, int len, int *x, int *y, int *channels_in_file, int desired_channels)
{
   stbi__context s;
   stbi__start_mem(&s,buffer,len);
   return stbi__load_and_postprocess_16bit(&s,x,y,channels_in_file,desired_channels);
}
extern stbi_us *stbi_load_16_from_callbacks(stbi_io_callbacks const *clbk, void *user, int *x, int *y, int *channels_in_file, int desired_channels)
{
   stbi__context s;
   stbi__start_callbacks(&s, (stbi_io_callbacks *)clbk, user);
   return stbi__load_and_postprocess_16bit(&s,x,y,channels_in_file,desired_channels);
}
extern stbi_uc *stbi_load_from_memory(stbi_uc const *buffer, int len, int *x, int *y, int *comp, int req_comp)
{
   stbi__context s;
   stbi__start_mem(&s,buffer,len);
   return stbi__load_and_postprocess_8bit(&s,x,y,comp,req_comp);
}
extern stbi_uc *stbi_load_from_callbacks(stbi_io_callbacks const *clbk, void *user, int *x, int *y, int *comp, int req_comp)
{
   stbi__context s;
   stbi__start_callbacks(&s, (stbi_io_callbacks *) clbk, user);
   return stbi__load_and_postprocess_8bit(&s,x,y,comp,req_comp);
}
extern int stbi_is_hdr_from_memory(stbi_uc const *buffer, int len)
{
   (void)sizeof(buffer);
   (void)sizeof(len);
   return 0;
}
extern int stbi_is_hdr_from_callbacks(stbi_io_callbacks const *clbk, void *user)
{
   (void)sizeof(clbk);
   (void)sizeof(user);
   return 0;
}
static float stbi__h2l_gamma_i=1.0f/2.2f, stbi__h2l_scale_i=1.0f;
extern void stbi_hdr_to_ldr_gamma(float gamma) { stbi__h2l_gamma_i = 1/gamma; }
extern void stbi_hdr_to_ldr_scale(float scale) { stbi__h2l_scale_i = 1/scale; }
enum
{
   STBI__SCAN_load=0,
   STBI__SCAN_type,
   STBI__SCAN_header
};
static void stbi__refill_buffer(stbi__context *s)
{
   int n = (s->io.read)(s->io_user_data,(char*)s->buffer_start,s->buflen);
   s->callback_already_read += (int) (s->img_buffer - s->img_buffer_original);
   if (n == 0) {
      s->read_from_callbacks = 0;
      s->img_buffer = s->buffer_start;
      s->img_buffer_end = s->buffer_start+1;
      *s->img_buffer = 0;
   } else {
      s->img_buffer = s->buffer_start;
      s->img_buffer_end = s->buffer_start + n;
   }
}
 static stbi_uc stbi__get8(stbi__context *s)
{
   if (s->img_buffer < s->img_buffer_end)
      return *s->img_buffer++;
   if (s->read_from_callbacks) {
      stbi__refill_buffer(s);
      return *s->img_buffer++;
   }
   return 0;
}
static void stbi__skip(stbi__context *s, int n)
{
   if (n == 0) return;
   if (n < 0) {
      s->img_buffer = s->img_buffer_end;
      return;
   }
   if (s->io.read) {
      int blen = (int) (s->img_buffer_end - s->img_buffer);
      if (blen < n) {
         s->img_buffer = s->img_buffer_end;
         (s->io.skip)(s->io_user_data, n - blen);
         return;
      }
   }
   s->img_buffer += n;
}
static int stbi__getn(stbi__context *s, stbi_uc *buffer, int n)
{
   if (s->io.read) {
      int blen = (int) (s->img_buffer_end - s->img_buffer);
      if (blen < n) {
         int res, count;
         memcpy(buffer, s->img_buffer, blen);
         count = (s->io.read)(s->io_user_data, (char*) buffer + blen, n - blen);
         res = (count == (n-blen));
         s->img_buffer = s->img_buffer_end;
         return res;
      }
   }
   if (s->img_buffer+n <= s->img_buffer_end) {
      memcpy(buffer, s->img_buffer, n);
      s->img_buffer += n;
      return 1;
   } else
      return 0;
}
static int stbi__get16be(stbi__context *s)
{
   int z = stbi__get8(s);
   return (z << 8) + stbi__get8(s);
}
static stbi__uint32 stbi__get32be(stbi__context *s)
{
   stbi__uint32 z = stbi__get16be(s);
   return (z << 16) + stbi__get16be(s);
}
static stbi_uc stbi__compute_y(int r, int g, int b)
{
   return (stbi_uc) (((r*77) + (g*150) + (29*b)) >> 8);
}
static unsigned char *stbi__convert_format(unsigned char *data, int img_n, int req_comp, unsigned int x, unsigned int y)
{
   int i,j;
   unsigned char *good;
   if (req_comp == img_n) return data;
   0;
   good = (unsigned char *) stbi__malloc_mad3(req_comp, x, y, 0);
   if (good == ((void *)0)) {
      free(data);
      return ((unsigned char *)(size_t) (stbi__err("Out of memory")?((void *)0):((void *)0)));
   }
   for (j=0; j < (int) y; ++j) {
      unsigned char *src = data + j * x * img_n ;
      unsigned char *dest = good + j * x * req_comp;
      switch (((img_n)*8+(req_comp))) {
         case ((1)*8+(2)): for(i=x-1; i >= 0; --i, src += 1, dest += 2) { dest[0]=src[0]; dest[1]=255; } break;
         case ((1)*8+(3)): for(i=x-1; i >= 0; --i, src += 1, dest += 3) { dest[0]=dest[1]=dest[2]=src[0]; } break;
         case ((1)*8+(4)): for(i=x-1; i >= 0; --i, src += 1, dest += 4) { dest[0]=dest[1]=dest[2]=src[0]; dest[3]=255; } break;
         case ((2)*8+(1)): for(i=x-1; i >= 0; --i, src += 2, dest += 1) { dest[0]=src[0]; } break;
         case ((2)*8+(3)): for(i=x-1; i >= 0; --i, src += 2, dest += 3) { dest[0]=dest[1]=dest[2]=src[0]; } break;
         case ((2)*8+(4)): for(i=x-1; i >= 0; --i, src += 2, dest += 4) { dest[0]=dest[1]=dest[2]=src[0]; dest[3]=src[1]; } break;
         case ((3)*8+(4)): for(i=x-1; i >= 0; --i, src += 3, dest += 4) { dest[0]=src[0];dest[1]=src[1];dest[2]=src[2];dest[3]=255; } break;
         case ((3)*8+(1)): for(i=x-1; i >= 0; --i, src += 3, dest += 1) { dest[0]=stbi__compute_y(src[0],src[1],src[2]); } break;
         case ((3)*8+(2)): for(i=x-1; i >= 0; --i, src += 3, dest += 2) { dest[0]=stbi__compute_y(src[0],src[1],src[2]); dest[1] = 255; } break;
         case ((4)*8+(1)): for(i=x-1; i >= 0; --i, src += 4, dest += 1) { dest[0]=stbi__compute_y(src[0],src[1],src[2]); } break;
         case ((4)*8+(2)): for(i=x-1; i >= 0; --i, src += 4, dest += 2) { dest[0]=stbi__compute_y(src[0],src[1],src[2]); dest[1] = src[3]; } break;
         case ((4)*8+(3)): for(i=x-1; i >= 0; --i, src += 4, dest += 3) { dest[0]=src[0];dest[1]=src[1];dest[2]=src[2]; } break;
         default: 0; free(data); free(good); return ((unsigned char *)(size_t) (stbi__err("Unsupported format conversion")?((void *)0):((void *)0)));
      }
   }
   free(data);
   return good;
}
static stbi__uint16 stbi__compute_y_16(int r, int g, int b)
{
   return (stbi__uint16) (((r*77) + (g*150) + (29*b)) >> 8);
}
static stbi__uint16 *stbi__convert_format16(stbi__uint16 *data, int img_n, int req_comp, unsigned int x, unsigned int y)
{
   int i,j;
   stbi__uint16 *good;
   if (req_comp == img_n) return data;
   0;
   good = (stbi__uint16 *) stbi__malloc(req_comp * x * y * 2);
   if (good == ((void *)0)) {
      free(data);
      return (stbi__uint16 *) ((unsigned char *)(size_t) (stbi__err("Out of memory")?((void *)0):((void *)0)));
   }
   for (j=0; j < (int) y; ++j) {
      stbi__uint16 *src = data + j * x * img_n ;
      stbi__uint16 *dest = good + j * x * req_comp;
      switch (((img_n)*8+(req_comp))) {
         case ((1)*8+(2)): for(i=x-1; i >= 0; --i, src += 1, dest += 2) { dest[0]=src[0]; dest[1]=0xffff; } break;
         case ((1)*8+(3)): for(i=x-1; i >= 0; --i, src += 1, dest += 3) { dest[0]=dest[1]=dest[2]=src[0]; } break;
         case ((1)*8+(4)): for(i=x-1; i >= 0; --i, src += 1, dest += 4) { dest[0]=dest[1]=dest[2]=src[0]; dest[3]=0xffff; } break;
         case ((2)*8+(1)): for(i=x-1; i >= 0; --i, src += 2, dest += 1) { dest[0]=src[0]; } break;
         case ((2)*8+(3)): for(i=x-1; i >= 0; --i, src += 2, dest += 3) { dest[0]=dest[1]=dest[2]=src[0]; } break;
         case ((2)*8+(4)): for(i=x-1; i >= 0; --i, src += 2, dest += 4) { dest[0]=dest[1]=dest[2]=src[0]; dest[3]=src[1]; } break;
         case ((3)*8+(4)): for(i=x-1; i >= 0; --i, src += 3, dest += 4) { dest[0]=src[0];dest[1]=src[1];dest[2]=src[2];dest[3]=0xffff; } break;
         case ((3)*8+(1)): for(i=x-1; i >= 0; --i, src += 3, dest += 1) { dest[0]=stbi__compute_y_16(src[0],src[1],src[2]); } break;
         case ((3)*8+(2)): for(i=x-1; i >= 0; --i, src += 3, dest += 2) { dest[0]=stbi__compute_y_16(src[0],src[1],src[2]); dest[1] = 0xffff; } break;
         case ((4)*8+(1)): for(i=x-1; i >= 0; --i, src += 4, dest += 1) { dest[0]=stbi__compute_y_16(src[0],src[1],src[2]); } break;
         case ((4)*8+(2)): for(i=x-1; i >= 0; --i, src += 4, dest += 2) { dest[0]=stbi__compute_y_16(src[0],src[1],src[2]); dest[1] = src[3]; } break;
         case ((4)*8+(3)): for(i=x-1; i >= 0; --i, src += 4, dest += 3) { dest[0]=src[0];dest[1]=src[1];dest[2]=src[2]; } break;
         default: 0; free(data); free(good); return (stbi__uint16*) ((unsigned char *)(size_t) (stbi__err("Unsupported format conversion")?((void *)0):((void *)0)));
      }
   }
   free(data);
   return good;
}
typedef struct
{
   stbi__uint16 fast[1 << 9];
   stbi__uint16 firstcode[16];
   int maxcode[17];
   stbi__uint16 firstsymbol[16];
   stbi_uc size[288];
   stbi__uint16 value[288];
} stbi__zhuffman;
 static int stbi__bitreverse16(int n)
{
  n = ((n & 0xAAAA) >> 1) | ((n & 0x5555) << 1);
  n = ((n & 0xCCCC) >> 2) | ((n & 0x3333) << 2);
  n = ((n & 0xF0F0) >> 4) | ((n & 0x0F0F) << 4);
  n = ((n & 0xFF00) >> 8) | ((n & 0x00FF) << 8);
  return n;
}
 static int stbi__bit_reverse(int v, int bits)
{
   0;
   return stbi__bitreverse16(v) >> (16-bits);
}
static int stbi__zbuild_huffman(stbi__zhuffman *z, const stbi_uc *sizelist, int num)
{
   int i,k=0;
   int code, next_code[16], sizes[17];
   memset(sizes, 0, sizeof(sizes));
   memset(z->fast, 0, sizeof(z->fast));
   for (i=0; i < num; ++i)
      ++sizes[sizelist[i]];
   sizes[0] = 0;
   for (i=1; i < 16; ++i)
      if (sizes[i] > (1 << i))
         return stbi__err("Corrupt PNG");
   code = 0;
   for (i=1; i < 16; ++i) {
      next_code[i] = code;
      z->firstcode[i] = (stbi__uint16) code;
      z->firstsymbol[i] = (stbi__uint16) k;
      code = (code + sizes[i]);
      if (sizes[i])
         if (code-1 >= (1 << i)) return stbi__err("Corrupt PNG");
      z->maxcode[i] = code << (16-i);
      code <<= 1;
      k += sizes[i];
   }
   z->maxcode[16] = 0x10000;
   for (i=0; i < num; ++i) {
      int s = sizelist[i];
      if (s) {
         int c = next_code[s] - z->firstcode[s] + z->firstsymbol[s];
         stbi__uint16 fastv = (stbi__uint16) ((s << 9) | i);
         z->size [c] = (stbi_uc ) s;
         z->value[c] = (stbi__uint16) i;
         if (s <= 9) {
            int j = stbi__bit_reverse(next_code[s],s);
            while (j < (1 << 9)) {
               z->fast[j] = fastv;
               j += (1 << s);
            }
         }
         ++next_code[s];
      }
   }
   return 1;
}
typedef struct
{
   stbi_uc *zbuffer, *zbuffer_end;
   int num_bits;
   int hit_zeof_once;
   stbi__uint32 code_buffer;
   char *zout;
   char *zout_start;
   char *zout_end;
   int z_expandable;
   stbi__zhuffman z_length, z_distance;
} stbi__zbuf;
 static int stbi__zeof(stbi__zbuf *z)
{
   return (z->zbuffer >= z->zbuffer_end);
}
 static stbi_uc stbi__zget8(stbi__zbuf *z)
{
   return stbi__zeof(z) ? 0 : *z->zbuffer++;
}
static void stbi__fill_bits(stbi__zbuf *z)
{
   do {
      if (z->code_buffer >= (1U << z->num_bits)) {
        z->zbuffer = z->zbuffer_end;
        return;
      }
      z->code_buffer |= (unsigned int) stbi__zget8(z) << z->num_bits;
      z->num_bits += 8;
   } while (z->num_bits <= 24);
}
 static unsigned int stbi__zreceive(stbi__zbuf *z, int n)
{
   unsigned int k;
   if (z->num_bits < n) stbi__fill_bits(z);
   k = z->code_buffer & ((1 << n) - 1);
   z->code_buffer >>= n;
   z->num_bits -= n;
   return k;
}
static int stbi__zhuffman_decode_slowpath(stbi__zbuf *a, stbi__zhuffman *z)
{
   int b,s,k;
   k = stbi__bit_reverse(a->code_buffer, 16);
   for (s=9 +1; ; ++s)
      if (k < z->maxcode[s])
         break;
   if (s >= 16) return -1;
   b = (k >> (16-s)) - z->firstcode[s] + z->firstsymbol[s];
   if (b >= 288) return -1;
   if (z->size[b] != s) return -1;
   a->code_buffer >>= s;
   a->num_bits -= s;
   return z->value[b];
}
 static int stbi__zhuffman_decode(stbi__zbuf *a, stbi__zhuffman *z)
{
   int b,s;
   if (a->num_bits < 16) {
      if (stbi__zeof(a)) {
         if (!a->hit_zeof_once) {
            a->hit_zeof_once = 1;
            a->num_bits += 16;
         } else {
            return -1;
         }
      } else {
         stbi__fill_bits(a);
      }
   }
   b = z->fast[a->code_buffer & ((1 << 9) - 1)];
   if (b) {
      s = b >> 9;
      a->code_buffer >>= s;
      a->num_bits -= s;
      return b & 511;
   }
   return stbi__zhuffman_decode_slowpath(a, z);
}
static int stbi__zexpand(stbi__zbuf *z, char *zout, int n)
{
   char *q;
   unsigned int cur, limit, old_limit;
   z->zout = zout;
   if (!z->z_expandable) return stbi__err("Corrupt PNG");
   cur = (unsigned int) (z->zout - z->zout_start);
   limit = old_limit = (unsigned) (z->zout_end - z->zout_start);
   if ((0x7fffffff * 2U + 1U) - cur < (unsigned) n) return stbi__err("Out of memory");
   while (cur + n > limit) {
      if(limit > (0x7fffffff * 2U + 1U) / 2) return stbi__err("Out of memory");
      limit *= 2;
   }
   q = (char *) realloc(z->zout_start,limit);
   (void)sizeof(old_limit);
   if (q == ((void *)0)) return stbi__err("Out of memory");
   z->zout_start = q;
   z->zout = q + cur;
   z->zout_end = q + limit;
   return 1;
}
static const int stbi__zlength_base[31] = {
   3,4,5,6,7,8,9,10,11,13,
   15,17,19,23,27,31,35,43,51,59,
   67,83,99,115,131,163,195,227,258,0,0 };
static const int stbi__zlength_extra[31]=
{ 0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0 };
static const int stbi__zdist_base[32] = { 1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,
257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0};
static const int stbi__zdist_extra[32] =
{ 0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13};
static int stbi__parse_huffman_block(stbi__zbuf *a)
{
   char *zout = a->zout;
   for(;;) {
      int z = stbi__zhuffman_decode(a, &a->z_length);
      if (z < 256) {
         if (z < 0) return stbi__err("Corrupt PNG");
         if (zout >= a->zout_end) {
            if (!stbi__zexpand(a, zout, 1)) return 0;
            zout = a->zout;
         }
         *zout++ = (char) z;
      } else {
         stbi_uc *p;
         int len,dist;
         if (z == 256) {
            a->zout = zout;
            if (a->hit_zeof_once && a->num_bits < 16) {
               return stbi__err("Corrupt PNG");
            }
            return 1;
         }
         if (z >= 286) return stbi__err("Corrupt PNG");
         z -= 257;
         len = stbi__zlength_base[z];
         if (stbi__zlength_extra[z]) len += stbi__zreceive(a, stbi__zlength_extra[z]);
         z = stbi__zhuffman_decode(a, &a->z_distance);
         if (z < 0 || z >= 30) return stbi__err("Corrupt PNG");
         dist = stbi__zdist_base[z];
         if (stbi__zdist_extra[z]) dist += stbi__zreceive(a, stbi__zdist_extra[z]);
         if (zout - a->zout_start < dist) return stbi__err("Corrupt PNG");
         if (len > a->zout_end - zout) {
            if (!stbi__zexpand(a, zout, len)) return 0;
            zout = a->zout;
         }
         p = (stbi_uc *) (zout - dist);
         if (dist == 1) {
            stbi_uc v = *p;
            if (len) { do *zout++ = v; while (--len); }
         } else {
            if (len) { do *zout++ = *p++; while (--len); }
         }
      }
   }
}
static int stbi__compute_huffman_codes(stbi__zbuf *a)
{
   static const stbi_uc length_dezigzag[19] = { 16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15 };
   stbi__zhuffman z_codelength;
   stbi_uc lencodes[286+32+137];
   stbi_uc codelength_sizes[19];
   int i,n;
   int hlit = stbi__zreceive(a,5) + 257;
   int hdist = stbi__zreceive(a,5) + 1;
   int hclen = stbi__zreceive(a,4) + 4;
   int ntot = hlit + hdist;
   memset(codelength_sizes, 0, sizeof(codelength_sizes));
   for (i=0; i < hclen; ++i) {
      int s = stbi__zreceive(a,3);
      codelength_sizes[length_dezigzag[i]] = (stbi_uc) s;
   }
   if (!stbi__zbuild_huffman(&z_codelength, codelength_sizes, 19)) return 0;
   n = 0;
   while (n < ntot) {
      int c = stbi__zhuffman_decode(a, &z_codelength);
      if (c < 0 || c >= 19) return stbi__err("Corrupt PNG");
      if (c < 16)
         lencodes[n++] = (stbi_uc) c;
      else {
         stbi_uc fill = 0;
         if (c == 16) {
            c = stbi__zreceive(a,2)+3;
            if (n == 0) return stbi__err("Corrupt PNG");
            fill = lencodes[n-1];
         } else if (c == 17) {
            c = stbi__zreceive(a,3)+3;
         } else if (c == 18) {
            c = stbi__zreceive(a,7)+11;
         } else {
            return stbi__err("Corrupt PNG");
         }
         if (ntot - n < c) return stbi__err("Corrupt PNG");
         memset(lencodes+n, fill, c);
         n += c;
      }
   }
   if (n != ntot) return stbi__err("Corrupt PNG");
   if (!stbi__zbuild_huffman(&a->z_length, lencodes, hlit)) return 0;
   if (!stbi__zbuild_huffman(&a->z_distance, lencodes+hlit, hdist)) return 0;
   return 1;
}
static int stbi__parse_uncompressed_block(stbi__zbuf *a)
{
   stbi_uc header[4];
   int len,nlen,k;
   if (a->num_bits & 7)
      stbi__zreceive(a, a->num_bits & 7);
   k = 0;
   while (a->num_bits > 0) {
      header[k++] = (stbi_uc) (a->code_buffer & 255);
      a->code_buffer >>= 8;
      a->num_bits -= 8;
   }
   if (a->num_bits < 0) return stbi__err("Corrupt PNG");
   while (k < 4)
      header[k++] = stbi__zget8(a);
   len = header[1] * 256 + header[0];
   nlen = header[3] * 256 + header[2];
   if (nlen != (len ^ 0xffff)) return stbi__err("Corrupt PNG");
   if (a->zbuffer + len > a->zbuffer_end) return stbi__err("Corrupt PNG");
   if (a->zout + len > a->zout_end)
      if (!stbi__zexpand(a, a->zout, len)) return 0;
   memcpy(a->zout, a->zbuffer, len);
   a->zbuffer += len;
   a->zout += len;
   return 1;
}
static int stbi__parse_zlib_header(stbi__zbuf *a)
{
   int cmf = stbi__zget8(a);
   int cm = cmf & 15;
   int flg = stbi__zget8(a);
   if (stbi__zeof(a)) return stbi__err("Corrupt PNG");
   if ((cmf*256+flg) % 31 != 0) return stbi__err("Corrupt PNG");
   if (flg & 32) return stbi__err("Corrupt PNG");
   if (cm != 8) return stbi__err("Corrupt PNG");
   return 1;
}
static const stbi_uc stbi__zdefault_length[288] =
{
   8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8, 8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,
   8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8, 8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,
   8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8, 8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,
   8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8, 8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,
   8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8, 9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,
   9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9, 9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,
   9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9, 9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,
   9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9, 9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,
   7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7, 7,7,7,7,7,7,7,7,8,8,8,8,8,8,8,8
};
static const stbi_uc stbi__zdefault_distance[32] =
{
   5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5
};
static int stbi__parse_zlib(stbi__zbuf *a, int parse_header)
{
   int final, type;
   if (parse_header)
      if (!stbi__parse_zlib_header(a)) return 0;
   a->num_bits = 0;
   a->code_buffer = 0;
   a->hit_zeof_once = 0;
   do {
      final = stbi__zreceive(a,1);
      type = stbi__zreceive(a,2);
      if (type == 0) {
         if (!stbi__parse_uncompressed_block(a)) return 0;
      } else if (type == 3) {
         return 0;
      } else {
         if (type == 1) {
            if (!stbi__zbuild_huffman(&a->z_length , stbi__zdefault_length , 288)) return 0;
            if (!stbi__zbuild_huffman(&a->z_distance, stbi__zdefault_distance, 32)) return 0;
         } else {
            if (!stbi__compute_huffman_codes(a)) return 0;
         }
         if (!stbi__parse_huffman_block(a)) return 0;
      }
   } while (!final);
   return 1;
}
static int stbi__do_zlib(stbi__zbuf *a, char *obuf, int olen, int exp, int parse_header)
{
   a->zout_start = obuf;
   a->zout = obuf;
   a->zout_end = obuf + olen;
   a->z_expandable = exp;
   return stbi__parse_zlib(a, parse_header);
}
extern char *stbi_zlib_decode_malloc_guesssize(const char *buffer, int len, int initial_size, int *outlen)
{
   stbi__zbuf a;
   char *p = (char *) stbi__malloc(initial_size);
   if (p == ((void *)0)) return ((void *)0);
   a.zbuffer = (stbi_uc *) buffer;
   a.zbuffer_end = (stbi_uc *) buffer + len;
   if (stbi__do_zlib(&a, p, initial_size, 1, 1)) {
      if (outlen) *outlen = (int) (a.zout - a.zout_start);
      return a.zout_start;
   } else {
      free(a.zout_start);
      return ((void *)0);
   }
}
extern char *stbi_zlib_decode_malloc(char const *buffer, int len, int *outlen)
{
   return stbi_zlib_decode_malloc_guesssize(buffer, len, 16384, outlen);
}
extern char *stbi_zlib_decode_malloc_guesssize_headerflag(const char *buffer, int len, int initial_size, int *outlen, int parse_header)
{
   stbi__zbuf a;
   char *p = (char *) stbi__malloc(initial_size);
   if (p == ((void *)0)) return ((void *)0);
   a.zbuffer = (stbi_uc *) buffer;
   a.zbuffer_end = (stbi_uc *) buffer + len;
   if (stbi__do_zlib(&a, p, initial_size, 1, parse_header)) {
      if (outlen) *outlen = (int) (a.zout - a.zout_start);
      return a.zout_start;
   } else {
      free(a.zout_start);
      return ((void *)0);
   }
}
extern int stbi_zlib_decode_buffer(char *obuffer, int olen, char const *ibuffer, int ilen)
{
   stbi__zbuf a;
   a.zbuffer = (stbi_uc *) ibuffer;
   a.zbuffer_end = (stbi_uc *) ibuffer + ilen;
   if (stbi__do_zlib(&a, obuffer, olen, 0, 1))
      return (int) (a.zout - a.zout_start);
   else
      return -1;
}
extern char *stbi_zlib_decode_noheader_malloc(char const *buffer, int len, int *outlen)
{
   stbi__zbuf a;
   char *p = (char *) stbi__malloc(16384);
   if (p == ((void *)0)) return ((void *)0);
   a.zbuffer = (stbi_uc *) buffer;
   a.zbuffer_end = (stbi_uc *) buffer+len;
   if (stbi__do_zlib(&a, p, 16384, 1, 0)) {
      if (outlen) *outlen = (int) (a.zout - a.zout_start);
      return a.zout_start;
   } else {
      free(a.zout_start);
      return ((void *)0);
   }
}
extern int stbi_zlib_decode_noheader_buffer(char *obuffer, int olen, const char *ibuffer, int ilen)
{
   stbi__zbuf a;
   a.zbuffer = (stbi_uc *) ibuffer;
   a.zbuffer_end = (stbi_uc *) ibuffer + ilen;
   if (stbi__do_zlib(&a, obuffer, olen, 0, 0))
      return (int) (a.zout - a.zout_start);
   else
      return -1;
}
typedef struct
{
   stbi__uint32 length;
   stbi__uint32 type;
} stbi__pngchunk;
static stbi__pngchunk stbi__get_chunk_header(stbi__context *s)
{
   stbi__pngchunk c;
   c.length = stbi__get32be(s);
   c.type = stbi__get32be(s);
   return c;
}
static int stbi__check_png_header(stbi__context *s)
{
   static const stbi_uc png_sig[8] = { 137,80,78,71,13,10,26,10 };
   int i;
   for (i=0; i < 8; ++i)
      if (stbi__get8(s) != png_sig[i]) return stbi__err("Not a PNG");
   return 1;
}
typedef struct
{
   stbi__context *s;
   stbi_uc *idata, *expanded, *out;
   int depth;
} stbi__png;
enum {
   STBI__F_none=0,
   STBI__F_sub=1,
   STBI__F_up=2,
   STBI__F_avg=3,
   STBI__F_paeth=4,
   STBI__F_avg_first
};
static stbi_uc first_row_filter[5] =
{
   STBI__F_none,
   STBI__F_sub,
   STBI__F_none,
   STBI__F_avg_first,
   STBI__F_sub
};
static int stbi__paeth(int a, int b, int c)
{
   int thresh = c*3 - (a + b);
   int lo = a < b ? a : b;
   int hi = a < b ? b : a;
   int t0 = (hi <= thresh) ? lo : c;
   int t1 = (thresh <= lo) ? hi : t0;
   return t1;
}
static const stbi_uc stbi__depth_scale_table[9] = { 0, 0xff, 0x55, 0, 0x11, 0,0,0, 0x01 };
static void stbi__create_png_alpha_expand8(stbi_uc *dest, stbi_uc *src, stbi__uint32 x, int img_n)
{
   int i;
   if (img_n == 1) {
      for (i=x-1; i >= 0; --i) {
         dest[i*2+1] = 255;
         dest[i*2+0] = src[i];
      }
   } else {
      0;
      for (i=x-1; i >= 0; --i) {
         dest[i*4+3] = 255;
         dest[i*4+2] = src[i*3+2];
         dest[i*4+1] = src[i*3+1];
         dest[i*4+0] = src[i*3+0];
      }
   }
}
static int stbi__create_png_image_raw(stbi__png *a, stbi_uc *raw, stbi__uint32 raw_len, int out_n, stbi__uint32 x, stbi__uint32 y, int depth, int color)
{
   int bytes = (depth == 16 ? 2 : 1);
   stbi__context *s = a->s;
   stbi__uint32 i,j,stride = x*out_n*bytes;
   stbi__uint32 img_len, img_width_bytes;
   stbi_uc *filter_buf;
   int all_ok = 1;
   int k;
   int img_n = s->img_n;
   int output_bytes = out_n*bytes;
   int filter_bytes = img_n*bytes;
   int width = x;
   0;
   a->out = (stbi_uc *) stbi__malloc_mad3(x, y, output_bytes, 0);
   if (!a->out) return stbi__err("Out of memory");
   if (!stbi__mad3sizes_valid(img_n, x, depth, 7)) return stbi__err("Corrupt PNG");
   img_width_bytes = (((img_n * x * depth) + 7) >> 3);
   if (!stbi__mad2sizes_valid(img_width_bytes, y, img_width_bytes)) return stbi__err("Corrupt PNG");
   img_len = (img_width_bytes + 1) * y;
   if (raw_len < img_len) return stbi__err("Corrupt PNG");
   filter_buf = (stbi_uc *) stbi__malloc_mad2(img_width_bytes, 2, 0);
   if (!filter_buf) return stbi__err("Out of memory");
   if (depth < 8) {
      filter_bytes = 1;
      width = img_width_bytes;
   }
   for (j=0; j < y; ++j) {
      stbi_uc *cur = filter_buf + (j & 1)*img_width_bytes;
      stbi_uc *prior = filter_buf + (~j & 1)*img_width_bytes;
      stbi_uc *dest = a->out + stride*j;
      int nk = width * filter_bytes;
      int filter = *raw++;
      if (filter > 4) {
         all_ok = stbi__err("Corrupt PNG");
         break;
      }
      if (j == 0) filter = first_row_filter[filter];
      switch (filter) {
      case STBI__F_none:
         memcpy(cur, raw, nk);
         break;
      case STBI__F_sub:
         memcpy(cur, raw, filter_bytes);
         for (k = filter_bytes; k < nk; ++k)
            cur[k] = ((stbi_uc) ((raw[k] + cur[k-filter_bytes]) & 255));
         break;
      case STBI__F_up:
         for (k = 0; k < nk; ++k)
            cur[k] = ((stbi_uc) ((raw[k] + prior[k]) & 255));
         break;
      case STBI__F_avg:
         for (k = 0; k < filter_bytes; ++k)
            cur[k] = ((stbi_uc) ((raw[k] + (prior[k]>>1)) & 255));
         for (k = filter_bytes; k < nk; ++k)
            cur[k] = ((stbi_uc) ((raw[k] + ((prior[k] + cur[k-filter_bytes])>>1)) & 255));
         break;
      case STBI__F_paeth:
         for (k = 0; k < filter_bytes; ++k)
            cur[k] = ((stbi_uc) ((raw[k] + prior[k]) & 255));
         for (k = filter_bytes; k < nk; ++k)
            cur[k] = ((stbi_uc) ((raw[k] + stbi__paeth(cur[k-filter_bytes], prior[k], prior[k-filter_bytes])) & 255));
         break;
      case STBI__F_avg_first:
         memcpy(cur, raw, filter_bytes);
         for (k = filter_bytes; k < nk; ++k)
            cur[k] = ((stbi_uc) ((raw[k] + (cur[k-filter_bytes] >> 1)) & 255));
         break;
      }
      raw += nk;
      if (depth < 8) {
         stbi_uc scale = (color == 0) ? stbi__depth_scale_table[depth] : 1;
         stbi_uc *in = cur;
         stbi_uc *out = dest;
         stbi_uc inb = 0;
         stbi__uint32 nsmp = x*img_n;
         if (depth == 4) {
            for (i=0; i < nsmp; ++i) {
               if ((i & 1) == 0) inb = *in++;
               *out++ = scale * (inb >> 4);
               inb <<= 4;
            }
         } else if (depth == 2) {
            for (i=0; i < nsmp; ++i) {
               if ((i & 3) == 0) inb = *in++;
               *out++ = scale * (inb >> 6);
               inb <<= 2;
            }
         } else {
            0;
            for (i=0; i < nsmp; ++i) {
               if ((i & 7) == 0) inb = *in++;
               *out++ = scale * (inb >> 7);
               inb <<= 1;
            }
         }
         if (img_n != out_n)
            stbi__create_png_alpha_expand8(dest, dest, x, img_n);
      } else if (depth == 8) {
         if (img_n == out_n)
            memcpy(dest, cur, x*img_n);
         else
            stbi__create_png_alpha_expand8(dest, cur, x, img_n);
      } else if (depth == 16) {
         stbi__uint16 *dest16 = (stbi__uint16*)dest;
         stbi__uint32 nsmp = x*img_n;
         if (img_n == out_n) {
            for (i = 0; i < nsmp; ++i, ++dest16, cur += 2)
               *dest16 = (cur[0] << 8) | cur[1];
         } else {
            0;
            if (img_n == 1) {
               for (i = 0; i < x; ++i, dest16 += 2, cur += 2) {
                  dest16[0] = (cur[0] << 8) | cur[1];
                  dest16[1] = 0xffff;
               }
            } else {
               0;
               for (i = 0; i < x; ++i, dest16 += 4, cur += 6) {
                  dest16[0] = (cur[0] << 8) | cur[1];
                  dest16[1] = (cur[2] << 8) | cur[3];
                  dest16[2] = (cur[4] << 8) | cur[5];
                  dest16[3] = 0xffff;
               }
            }
         }
      }
   }
   free(filter_buf);
   if (!all_ok) return 0;
   return 1;
}
static int stbi__create_png_image(stbi__png *a, stbi_uc *image_data, stbi__uint32 image_data_len, int out_n, int depth, int color, int interlaced)
{
   int bytes = (depth == 16 ? 2 : 1);
   int out_bytes = out_n * bytes;
   stbi_uc *final;
   int p;
   if (!interlaced)
      return stbi__create_png_image_raw(a, image_data, image_data_len, out_n, a->s->img_x, a->s->img_y, depth, color);
   final = (stbi_uc *) stbi__malloc_mad3(a->s->img_x, a->s->img_y, out_bytes, 0);
   if (!final) return stbi__err("Out of memory");
   for (p=0; p < 7; ++p) {
      int xorig[] = { 0,4,0,2,0,1,0 };
      int yorig[] = { 0,0,4,0,2,0,1 };
      int xspc[] = { 8,8,4,4,2,2,1 };
      int yspc[] = { 8,8,8,4,4,2,2 };
      int i,j,x,y;
      x = (a->s->img_x - xorig[p] + xspc[p]-1) / xspc[p];
      y = (a->s->img_y - yorig[p] + yspc[p]-1) / yspc[p];
      if (x && y) {
         stbi__uint32 img_len = ((((a->s->img_n * x * depth) + 7) >> 3) + 1) * y;
         if (!stbi__create_png_image_raw(a, image_data, image_data_len, out_n, x, y, depth, color)) {
            free(final);
            return 0;
         }
         for (j=0; j < y; ++j) {
            for (i=0; i < x; ++i) {
               int out_y = j*yspc[p]+yorig[p];
               int out_x = i*xspc[p]+xorig[p];
               memcpy(final + out_y*a->s->img_x*out_bytes + out_x*out_bytes,
                      a->out + (j*x+i)*out_bytes, out_bytes);
            }
         }
         free(a->out);
         image_data += img_len;
         image_data_len -= img_len;
      }
   }
   a->out = final;
   return 1;
}
static int stbi__compute_transparency(stbi__png *z, stbi_uc tc[3], int out_n)
{
   stbi__context *s = z->s;
   stbi__uint32 i, pixel_count = s->img_x * s->img_y;
   stbi_uc *p = z->out;
   0;
   if (out_n == 2) {
      for (i=0; i < pixel_count; ++i) {
         p[1] = (p[0] == tc[0] ? 0 : 255);
         p += 2;
      }
   } else {
      for (i=0; i < pixel_count; ++i) {
         if (p[0] == tc[0] && p[1] == tc[1] && p[2] == tc[2])
            p[3] = 0;
         p += 4;
      }
   }
   return 1;
}
static int stbi__compute_transparency16(stbi__png *z, stbi__uint16 tc[3], int out_n)
{
   stbi__context *s = z->s;
   stbi__uint32 i, pixel_count = s->img_x * s->img_y;
   stbi__uint16 *p = (stbi__uint16*) z->out;
   0;
   if (out_n == 2) {
      for (i = 0; i < pixel_count; ++i) {
         p[1] = (p[0] == tc[0] ? 0 : 65535);
         p += 2;
      }
   } else {
      for (i = 0; i < pixel_count; ++i) {
         if (p[0] == tc[0] && p[1] == tc[1] && p[2] == tc[2])
            p[3] = 0;
         p += 4;
      }
   }
   return 1;
}
static int stbi__expand_png_palette(stbi__png *a, stbi_uc *palette, int len, int pal_img_n)
{
   stbi__uint32 i, pixel_count = a->s->img_x * a->s->img_y;
   stbi_uc *p, *temp_out, *orig = a->out;
   p = (stbi_uc *) stbi__malloc_mad2(pixel_count, pal_img_n, 0);
   if (p == ((void *)0)) return stbi__err("Out of memory");
   temp_out = p;
   if (pal_img_n == 3) {
      for (i=0; i < pixel_count; ++i) {
         int n = orig[i]*4;
         p[0] = palette[n ];
         p[1] = palette[n+1];
         p[2] = palette[n+2];
         p += 3;
      }
   } else {
      for (i=0; i < pixel_count; ++i) {
         int n = orig[i]*4;
         p[0] = palette[n ];
         p[1] = palette[n+1];
         p[2] = palette[n+2];
         p[3] = palette[n+3];
         p += 4;
      }
   }
   free(a->out);
   a->out = temp_out;
   (void)sizeof(len);
   return 1;
}
static int stbi__unpremultiply_on_load_global = 0;
static int stbi__de_iphone_flag_global = 0;
extern void stbi_set_unpremultiply_on_load(int flag_true_if_should_unpremultiply)
{
   stbi__unpremultiply_on_load_global = flag_true_if_should_unpremultiply;
}
extern void stbi_convert_iphone_png_to_rgb(int flag_true_if_should_convert)
{
   stbi__de_iphone_flag_global = flag_true_if_should_convert;
}
static _Thread_local int stbi__unpremultiply_on_load_local, stbi__unpremultiply_on_load_set;
static _Thread_local int stbi__de_iphone_flag_local, stbi__de_iphone_flag_set;
extern void stbi_set_unpremultiply_on_load_thread(int flag_true_if_should_unpremultiply)
{
   stbi__unpremultiply_on_load_local = flag_true_if_should_unpremultiply;
   stbi__unpremultiply_on_load_set = 1;
}
extern void stbi_convert_iphone_png_to_rgb_thread(int flag_true_if_should_convert)
{
   stbi__de_iphone_flag_local = flag_true_if_should_convert;
   stbi__de_iphone_flag_set = 1;
}
static void stbi__de_iphone(stbi__png *z)
{
   stbi__context *s = z->s;
   stbi__uint32 i, pixel_count = s->img_x * s->img_y;
   stbi_uc *p = z->out;
   if (s->img_out_n == 3) {
      for (i=0; i < pixel_count; ++i) {
         stbi_uc t = p[0];
         p[0] = p[2];
         p[2] = t;
         p += 3;
      }
   } else {
      0;
      if ((stbi__unpremultiply_on_load_set ? stbi__unpremultiply_on_load_local : stbi__unpremultiply_on_load_global)) {
         for (i=0; i < pixel_count; ++i) {
            stbi_uc a = p[3];
            stbi_uc t = p[0];
            if (a) {
               stbi_uc half = a / 2;
               p[0] = (p[2] * 255 + half) / a;
               p[1] = (p[1] * 255 + half) / a;
               p[2] = ( t * 255 + half) / a;
            } else {
               p[0] = p[2];
               p[2] = t;
            }
            p += 4;
         }
      } else {
         for (i=0; i < pixel_count; ++i) {
            stbi_uc t = p[0];
            p[0] = p[2];
            p[2] = t;
            p += 4;
         }
      }
   }
}
static int stbi__parse_png_file(stbi__png *z, int scan, int req_comp)
{
   stbi_uc palette[1024], pal_img_n=0;
   stbi_uc has_trans=0, tc[3]={0};
   stbi__uint16 tc16[3];
   stbi__uint32 ioff=0, idata_limit=0, i, pal_len=0;
   int first=1,k,interlace=0, color=0, is_iphone=0;
   stbi__context *s = z->s;
   z->expanded = ((void *)0);
   z->idata = ((void *)0);
   z->out = ((void *)0);
   if (!stbi__check_png_header(s)) return 0;
   if (scan == STBI__SCAN_type) return 1;
   for (;;) {
      stbi__pngchunk c = stbi__get_chunk_header(s);
      switch (c.type) {
         case (((unsigned) ('C') << 24) + ((unsigned) ('g') << 16) + ((unsigned) ('B') << 8) + (unsigned) ('I')):
            is_iphone = 1;
            stbi__skip(s, c.length);
            break;
         case (((unsigned) ('I') << 24) + ((unsigned) ('H') << 16) + ((unsigned) ('D') << 8) + (unsigned) ('R')): {
            int comp,filter;
            if (!first) return stbi__err("Corrupt PNG");
            first = 0;
            if (c.length != 13) return stbi__err("Corrupt PNG");
            s->img_x = stbi__get32be(s);
            s->img_y = stbi__get32be(s);
            if (s->img_y > (1 << 24)) return stbi__err("Very large image (corrupt?)");
            if (s->img_x > (1 << 24)) return stbi__err("Very large image (corrupt?)");
            z->depth = stbi__get8(s); if (z->depth != 1 && z->depth != 2 && z->depth != 4 && z->depth != 8 && z->depth != 16) return stbi__err("PNG not supported: 1/2/4/8/16-bit only");
            color = stbi__get8(s); if (color > 6) return stbi__err("Corrupt PNG");
            if (color == 3 && z->depth == 16) return stbi__err("Corrupt PNG");
            if (color == 3) pal_img_n = 3; else if (color & 1) return stbi__err("Corrupt PNG");
            comp = stbi__get8(s); if (comp) return stbi__err("Corrupt PNG");
            filter= stbi__get8(s); if (filter) return stbi__err("Corrupt PNG");
            interlace = stbi__get8(s); if (interlace>1) return stbi__err("Corrupt PNG");
            if (!s->img_x || !s->img_y) return stbi__err("Corrupt PNG");
            if (!pal_img_n) {
               s->img_n = (color & 2 ? 3 : 1) + (color & 4 ? 1 : 0);
               if ((1 << 30) / s->img_x / s->img_n < s->img_y) return stbi__err("Image too large to decode");
            } else {
               s->img_n = 1;
               if ((1 << 30) / s->img_x / 4 < s->img_y) return stbi__err("Corrupt PNG");
            }
            break;
         }
         case (((unsigned) ('P') << 24) + ((unsigned) ('L') << 16) + ((unsigned) ('T') << 8) + (unsigned) ('E')): {
            if (first) return stbi__err("Corrupt PNG");
            if (c.length > 256*3) return stbi__err("Corrupt PNG");
            pal_len = c.length / 3;
            if (pal_len * 3 != c.length) return stbi__err("Corrupt PNG");
            for (i=0; i < pal_len; ++i) {
               palette[i*4+0] = stbi__get8(s);
               palette[i*4+1] = stbi__get8(s);
               palette[i*4+2] = stbi__get8(s);
               palette[i*4+3] = 255;
            }
            break;
         }
         case (((unsigned) ('t') << 24) + ((unsigned) ('R') << 16) + ((unsigned) ('N') << 8) + (unsigned) ('S')): {
            if (first) return stbi__err("Corrupt PNG");
            if (z->idata) return stbi__err("Corrupt PNG");
            if (pal_img_n) {
               if (scan == STBI__SCAN_header) { s->img_n = 4; return 1; }
               if (pal_len == 0) return stbi__err("Corrupt PNG");
               if (c.length > pal_len) return stbi__err("Corrupt PNG");
               pal_img_n = 4;
               for (i=0; i < c.length; ++i)
                  palette[i*4+3] = stbi__get8(s);
            } else {
               if (!(s->img_n & 1)) return stbi__err("Corrupt PNG");
               if (c.length != (stbi__uint32) s->img_n*2) return stbi__err("Corrupt PNG");
               has_trans = 1;
               if (scan == STBI__SCAN_header) { ++s->img_n; return 1; }
               if (z->depth == 16) {
                  for (k = 0; k < s->img_n && k < 3; ++k)
                     tc16[k] = (stbi__uint16)stbi__get16be(s);
               } else {
                  for (k = 0; k < s->img_n && k < 3; ++k)
                     tc[k] = (stbi_uc)(stbi__get16be(s) & 255) * stbi__depth_scale_table[z->depth];
               }
            }
            break;
         }
         case (((unsigned) ('I') << 24) + ((unsigned) ('D') << 16) + ((unsigned) ('A') << 8) + (unsigned) ('T')): {
            if (first) return stbi__err("Corrupt PNG");
            if (pal_img_n && !pal_len) return stbi__err("Corrupt PNG");
            if (scan == STBI__SCAN_header) {
               if (pal_img_n)
                  s->img_n = pal_img_n;
               return 1;
            }
            if (c.length > (1u << 30)) return stbi__err("IDAT section larger than 2^30 bytes");
            if ((int)(ioff + c.length) < (int)ioff) return 0;
            if (ioff + c.length > idata_limit) {
               stbi__uint32 idata_limit_old = idata_limit;
               stbi_uc *p;
               if (idata_limit == 0) idata_limit = c.length > 4096 ? c.length : 4096;
               while (ioff + c.length > idata_limit)
                  idata_limit *= 2;
               (void)sizeof(idata_limit_old);
               p = (stbi_uc *) realloc(z->idata,idata_limit); if (p == ((void *)0)) return stbi__err("Out of memory");
               z->idata = p;
            }
            if (!stbi__getn(s, z->idata+ioff,c.length)) return stbi__err("Corrupt PNG");
            ioff += c.length;
            break;
         }
         case (((unsigned) ('I') << 24) + ((unsigned) ('E') << 16) + ((unsigned) ('N') << 8) + (unsigned) ('D')): {
            stbi__uint32 raw_len, bpl;
            if (first) return stbi__err("Corrupt PNG");
            if (scan != STBI__SCAN_load) return 1;
            if (z->idata == ((void *)0)) return stbi__err("Corrupt PNG");
            bpl = (s->img_x * z->depth + 7) / 8;
            raw_len = bpl * s->img_y * s->img_n + s->img_y ;
            z->expanded = (stbi_uc *) stbi_zlib_decode_malloc_guesssize_headerflag((char *) z->idata, ioff, raw_len, (int *) &raw_len, !is_iphone);
            if (z->expanded == ((void *)0)) return 0;
            free(z->idata); z->idata = ((void *)0);
            if ((req_comp == s->img_n+1 && req_comp != 3 && !pal_img_n) || has_trans)
               s->img_out_n = s->img_n+1;
            else
               s->img_out_n = s->img_n;
            if (!stbi__create_png_image(z, z->expanded, raw_len, s->img_out_n, z->depth, color, interlace)) return 0;
            if (has_trans) {
               if (z->depth == 16) {
                  if (!stbi__compute_transparency16(z, tc16, s->img_out_n)) return 0;
               } else {
                  if (!stbi__compute_transparency(z, tc, s->img_out_n)) return 0;
               }
            }
            if (is_iphone && (stbi__de_iphone_flag_set ? stbi__de_iphone_flag_local : stbi__de_iphone_flag_global) && s->img_out_n > 2)
               stbi__de_iphone(z);
            if (pal_img_n) {
               s->img_n = pal_img_n;
               s->img_out_n = pal_img_n;
               if (req_comp >= 3) s->img_out_n = req_comp;
               if (!stbi__expand_png_palette(z, palette, pal_len, s->img_out_n))
                  return 0;
            } else if (has_trans) {
               ++s->img_n;
            }
            free(z->expanded); z->expanded = ((void *)0);
            stbi__get32be(s);
            return 1;
         }
         default:
            if (first) return stbi__err("Corrupt PNG");
            if ((c.type & (1 << 29)) == 0) {
               static char invalid_chunk[] = "XXXX PNG chunk not known";
               invalid_chunk[0] = ((stbi_uc) ((c.type >> 24) & 255));
               invalid_chunk[1] = ((stbi_uc) ((c.type >> 16) & 255));
               invalid_chunk[2] = ((stbi_uc) ((c.type >> 8) & 255));
               invalid_chunk[3] = ((stbi_uc) ((c.type >> 0) & 255));
               return stbi__err("PNG not supported: unknown PNG chunk type");
            }
            stbi__skip(s, c.length);
            break;
      }
      stbi__get32be(s);
   }
}
static void *stbi__do_png(stbi__png *p, int *x, int *y, int *n, int req_comp, stbi__result_info *ri)
{
   void *result=((void *)0);
   if (req_comp < 0 || req_comp > 4) return ((unsigned char *)(size_t) (stbi__err("Internal error")?((void *)0):((void *)0)));
   if (stbi__parse_png_file(p, STBI__SCAN_load, req_comp)) {
      if (p->depth <= 8)
         ri->bits_per_channel = 8;
      else if (p->depth == 16)
         ri->bits_per_channel = 16;
      else
         return ((unsigned char *)(size_t) (stbi__err("PNG not supported: unsupported color depth")?((void *)0):((void *)0)));
      result = p->out;
      p->out = ((void *)0);
      if (req_comp && req_comp != p->s->img_out_n) {
         if (ri->bits_per_channel == 8)
            result = stbi__convert_format((unsigned char *) result, p->s->img_out_n, req_comp, p->s->img_x, p->s->img_y);
         else
            result = stbi__convert_format16((stbi__uint16 *) result, p->s->img_out_n, req_comp, p->s->img_x, p->s->img_y);
         p->s->img_out_n = req_comp;
         if (result == ((void *)0)) return result;
      }
      *x = p->s->img_x;
      *y = p->s->img_y;
      if (n) *n = p->s->img_n;
   }
   free(p->out); p->out = ((void *)0);
   free(p->expanded); p->expanded = ((void *)0);
   free(p->idata); p->idata = ((void *)0);
   return result;
}
static void *stbi__png_load(stbi__context *s, int *x, int *y, int *comp, int req_comp, stbi__result_info *ri)
{
   stbi__png p;
   p.s = s;
   return stbi__do_png(&p, x,y,comp,req_comp, ri);
}
static int stbi__png_test(stbi__context *s)
{
   int r;
   r = stbi__check_png_header(s);
   stbi__rewind(s);
   return r;
}
static int stbi__png_info_raw(stbi__png *p, int *x, int *y, int *comp)
{
   if (!stbi__parse_png_file(p, STBI__SCAN_header, 0)) {
      stbi__rewind( p->s );
      return 0;
   }
   if (x) *x = p->s->img_x;
   if (y) *y = p->s->img_y;
   if (comp) *comp = p->s->img_n;
   return 1;
}
static int stbi__png_info(stbi__context *s, int *x, int *y, int *comp)
{
   stbi__png p;
   p.s = s;
   return stbi__png_info_raw(&p, x, y, comp);
}
static int stbi__png_is16(stbi__context *s)
{
   stbi__png p;
   p.s = s;
   if (!stbi__png_info_raw(&p, ((void *)0), ((void *)0), ((void *)0)))
    return 0;
   if (p.depth != 16) {
      stbi__rewind(p.s);
      return 0;
   }
   return 1;
}
static int stbi__info_main(stbi__context *s, int *x, int *y, int *comp)
{
   if (stbi__png_info(s, x, y, comp)) return 1;
   return stbi__err("Image not of any known type, or corrupt");
}
static int stbi__is_16_main(stbi__context *s)
{
   if (stbi__png_is16(s)) return 1;
   return 0;
}
extern int stbi_info_from_memory(stbi_uc const *buffer, int len, int *x, int *y, int *comp)
{
   stbi__context s;
   stbi__start_mem(&s,buffer,len);
   return stbi__info_main(&s,x,y,comp);
}
extern int stbi_info_from_callbacks(stbi_io_callbacks const *c, void *user, int *x, int *y, int *comp)
{
   stbi__context s;
   stbi__start_callbacks(&s, (stbi_io_callbacks *) c, user);
   return stbi__info_main(&s,x,y,comp);
}
extern int stbi_is_16_bit_from_memory(stbi_uc const *buffer, int len)
{
   stbi__context s;
   stbi__start_mem(&s,buffer,len);
   return stbi__is_16_main(&s);
}
extern int stbi_is_16_bit_from_callbacks(stbi_io_callbacks const *c, void *user)
{
   stbi__context s;
   stbi__start_callbacks(&s, (stbi_io_callbacks *) c, user);
   return stbi__is_16_main(&s);
}
int main(int argc, char **argv) {
    int w, h, channels;
    unsigned char *data;
    FILE *f;
    long fsize;
    unsigned char *buf;
    unsigned long checksum;
    int i;
    if (argc < 2) {
        printf("usage: stb_test <image.png>\n");
        return 1;
    }
    f = fopen(argv[1], "rb");
    if (!f) {
        printf("FAIL: cannot open %s\n", argv[1]);
        return 1;
    }
    fseek(f, 0, 2);
    fsize = ftell(f);
    fseek(f, 0, 0);
    buf = (unsigned char *)malloc(fsize);
    if (!buf) {
        fclose(f);
        printf("FAIL: malloc\n");
        return 1;
    }
    fread(buf, 1, fsize, f);
    fclose(f);
    data = stbi_load_from_memory(buf, fsize, &w, &h, &channels, 0);
    free(buf);
    if (!data) {
        printf("FAIL: decode error: %s\n", stbi_failure_reason());
        return 1;
    }
    printf("loaded: %dx%d channels=%d\n", w, h, channels);
    f = fopen("pixels.raw", "wb");
    if (f) {
        fwrite(data, 1, w * h * channels, f);
        fclose(f);
    }
    checksum = 0;
    for (i = 0; i < w * h * channels; i++) {
        checksum = checksum * 31 + data[i];
    }
    printf("checksum=%lu bytes=%d\n", checksum, w * h * channels);
    stbi_image_free(data);
    return 0;
}
