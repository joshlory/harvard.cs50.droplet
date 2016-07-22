define(function(require, exports, module) {
  var droplet = require('./droplet/dist/droplet-full.js');
  var opentip = require('./opentip-native.js');

  var worker = null;

  // TODO figure out how to require this from ace, possibly?
  function createWorker(mod) {
      // nameToUrl is renamed to toUrl in requirejs 2
      if (require.nameToUrl && !require.toUrl)
          require.toUrl = require.nameToUrl;

      if (config.get("packaged") || !require.toUrl) {
          workerUrl = workerUrl || config.moduleUrl(mod, "worker");
      } else {
          var skipBalancers = true; // load all scripts from one domain, workers don't support CORS headers
          var normalizePath = this.$normalizePath;
          workerUrl = workerUrl || normalizePath(require.toUrl(mod));
      }

      console.log('USING', workerUrl);

      try {
          return new Worker(workerUrl);
      } catch(e) {
          if (e instanceof window.DOMException) {
              console.log('Blobbifying');
              // Likely same origin problem. Use importScripts from a shim Worker
              var blob = this.$workerBlob(workerUrl);
              var URL = window.URL || window.webkitURL;
              var blobURL = URL.createObjectURL(blob);

              console.log('blobURL', blobURL);

              var worker = new Worker(blobURL);

              setTimeout(function() { // IE EDGE needs a timeout here
                  URL.revokeObjectURL(blobURL);
              });

              return worker;
          } else {
              throw e;
          }
      }
  };

  function workerBlob(url) {
    // workerUrl can be protocol relative
    // importScripts only takes fully qualified urls
    var script = "importScripts('" + url + "');";
    try {
        return new Blob([script], {"type": "application/javascript"});
    } catch (e) { // Backwards-compatibility
        var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
        var blobBuilder = new BlobBuilder();
        blobBuilder.append(script);
        return blobBuilder.getBlob("application/javascript");
    }

  var OPT_MAP = {
    'ace/mode/c_cpp': {
      "mode": "c_cpp",
      "viewSettings": {
        "padding": 10
      },
      "showDropdownInPalette": true,
      "palette": [
        {
          "name": "Control Flow",
          "color": "orange",
          "blocks": [
            {
              "block": "int main(void)\n{\n  \n}",
              "context": "externalDeclaration"
            },
            {
              "block": "type myMethod(void)\n{\n  \n}",
              "context": "externalDeclaration"
            },
            {
              "block": "return 0;",
              "context": "blockItem"
            },
            {
              "block": "if (a == b)\n{\n  \n}",
              "context": "blockItem"
            },
            {
              "block": "while (a < b)\n{\n  \n}",
              "context": "blockItem"
            },
            {
              "block": "for (int i = 0; i < n; i++)\n{\n  \n}",
              "context": "blockItem"
            },
            {
              "block": "break;",
              "context": "blockItem"
            }
          ]
        },
        {
          "name": "Operations",
          "color": "green",
          "blocks": [
            {
              "block": "int variable = 0;",
              "context": "blockItem"
            },
            {
              "block": "variable = newValue;",
              "context": "blockItem"
            },
            {
              "block": "a + b",
              "context": "expression"
            },
            {
              "block": "a - b",
              "context": "expression"
            },
            {
              "block": "a * b",
              "context": "expression"
            },
            {
              "block": "a / b",
              "context": "expression"
            },
            {
              "block": "a % b",
              "context": "expression"
            },
            {
              "block": "a == b",
              "context": "expression"
            },
            {
              "block": "a != b",
              "context": "expression"
            },
            {
              "block": "a < b",
              "context": "expression"
            },
            {
              "block": "a > b",
              "context": "expression"
            },
            {
              "block": "a || b",
              "context": "expression"
            },
            {
              "block": "a && b",
              "context": "expression"
            }
          ]
        },
        {
          "name": "cs50.h",
          "color": "blue",
          "blocks": [
            {
              "block": "#include <cs50.h>",
              "context": "compilationUnit"
            },
            {
              "block": "GetString();",
              "context": "blockItem",
              "title": "<b>returns a string from stdin</b></br>\n<p>\nReads a line of text from standard input and returns it as a `string` (`char *`), sans trailing newline character. (Ergo, \nif user inputs only `\"\\n\"`, returns \"\" not `NULL`.)  Returns `NULL` upon error or no input whatsoever (i.e., just `EOF`). \nLeading and trailing whitespace is not ignored. Stores `string` on heap (via `malloc`); memory must be freed by caller to \navoid leak.\n\n</p>"
            },
            {
              "block": "GetLongLong();",
              "context": "blockItem",
              "title": "<b>returns a long long from stdin</b></br>\n<p>\nReads a line of text from standard input and returns an equivalent `long long` in the range [-2^63^ + 1, 2^63^ - 2], if \npossible; if text does not represent such a `long long`, user is prompted to retry. Leading and trailing whitespace is \nignored. For simplicity, overflow is not detected. If line can't be read, returns `LLONG_MAX`.\n\n</p>"
            },
            {
              "block": "GetInt();",
              "context": "blockItem",
              "title": "<b>returns an int from stdin</b></br>\n<p>\nReads a line of text from standard input and returns it as an `int` in the range of [-2^31^ + 1, 2^31^ - 2], if possible; \nif text does not represent such an `int`, user is prompted to retry. Leading and trailing whitespace is ignored. For \nsimplicity, overflow is not detected. If line can't be read, returns `INT_MAX`.\n\n</p>"
            },
            {
              "block": "GetFloat();",
              "context": "blockItem",
              "title": "<b>returns a float from stdin</b></br>\n<p>\nReads a line of text from standard input and returns the equivalent `float` as precisely as possible; if text does not \nrepresent a `float`, user is prompted to retry. Leading and trailing whitespace is ignored. For simplicity, overflow \nand underflow are not detected.  If line can't be read, returns `FLT_MAX`.\n\n</p>"
            },
            {
              "block": "GetDouble();",
              "context": "blockItem",
              "title": "<b>returns a double from stdin</b></br>\n<p>\nReads a line of text from standard input and returns the equivalent `double` as precisely as possible; if text does not \nrepresent a `double`, user is prompted to retry. Leading and trailing whitespace is ignored. For simplicity, overflow \nand underflow are not detected. If line can't be read, returns `DBL_MAX`.\n\n</p>"
            },
            {
              "block": "GetChar();",
              "context": "blockItem",
              "title": "<b>returns a char from stdin</b></br>\n<p>\nReads a line of text from standard input and returns the equivalent `char`; if text does not represent a `char`, user is \nprompted to retry. Leading and trailing whitespace is ignored. If line can't be read, returns `CHAR_MAX`.\n\n</p>"
            }
          ]
        },
        {
          "name": "stdio.h",
          "color": "blue",
          "blocks": [
            {
              "block": "#include <stdio.h>",
              "context": "compilationUnit"
            },
            {
              "block": "sprintf(ptr, format);",
              "context": "blockItem",
              "title": "<b>send formatted output to a string</b></br>\n<p>\n`sprintf` stores in `ptr` a string formatted along the lines of `format`.</p>"
            },
            {
              "block": "scanf(format);",
              "context": "blockItem",
              "title": "<b>read in a formatted string from stdin</b></br>\n<p>\n`scanf` reads in from `stdin` (usually your keyboard) input that matches \n`format`. Notice, this function is almost identical to `fscanf` except it \nis missing the first argument `FILE* fp`. This is because `scanf` just assumes \nthe input is going to be coming from the keyboard.</p>"
            },
            {
              "block": "printf(format);",
              "context": "blockItem",
              "title": "<b>prints to stdout</b></br>\n<p>\n`printf` prints some formatted output to `stdout` (your computer terminal).\nYou specify the format with a `%` followed by a `c` for a character, `d` for\na digit, and `s` for a string. There are a number of other identifiers, the\naformentioned, however, are the most used.</p>"
            },
            {
              "block": "fwrite(ptr, size, blocks, fp);",
              "context": "blockItem",
              "title": "<b>write to a file</b></br>\n<p>\nSimilar to `fread`, `fwrite` writes out to file `fp` an element of `size` bytes \n`blocks` number of times. So, for example, if `size` is 50 and `blocks` 10, then \n`fwrite` will write to `fp` 10 times, each time a \"chunk\" of 50 bytes (for a total \nof 500 bytes). On each `fwrite`, it will write from the buffer pointer to by `ptr`.</p>"
            },
            {
              "block": "fseek(fp, offset, from_where);",
              "context": "blockItem",
              "title": "<b>sets file position</b></br>\n<p>\nUse `fseek` when you want to change the offset of the file pointer `fp`.\nThis is an extremely useful tool. Normally, when reading in from a file, \nthe pointer continues in one direction, from the start of the file to the\nend. `fseek`, however, allows you to change the location of the file pointer.</p>"
            },
            {
              "block": "fscanf(fp, format);",
              "context": "blockItem",
              "title": "<b>read in a formatted string</b></br>\n<p>\n`fscanf` reads in from file `fp` input that matches `format`.</p>"
            },
            {
              "block": "fread(ptr, size, blocks, fp);",
              "context": "blockItem",
              "title": "<b>read from a file</b></br>\n<p>\n`fread` reads in from file `fp` an element of `size` bytes `blocks` number of\ntimes. So, for example, if `size` is 50 and `blocks` 10, then `fread` will read\nin from `fp` 10 times, each time reading in 50 bytes (for a total of 500 bytes).\nOn each `fread`, it will store the bytes in a buffer pointer to by `ptr`.</p>"
            },
            {
              "block": "fputs(s, fp);",
              "context": "blockItem",
              "title": "<b>write a string to a file</b></br>\n<p>\n`fputs` is used to write a null terminated string `s` to file `fp`.\n        \n</p>"
            },
            {
              "block": "fputc(character, fp);",
              "context": "blockItem",
              "title": "<b>write a character to a file</b></br>\n<p>\nUsed to write a single character to a file.\n        \n</p>"
            },
            {
              "block": "fprintf(fp, format);",
              "context": "blockItem",
              "title": "<b>print out a formatted string</b></br>\n<p>\nUsed to print to a file in a specific, formatted fashion, `fprintf` prints\nto the file `fp` as the string `format` indicates.\n        \n</p>"
            },
            {
              "block": "fopen(filename, mode);",
              "context": "blockItem",
              "title": "<b>opens a file</b></br>\n<p>\n`fopen` opens file `filename` in the specified `mode`. The `mode` can be a\nnumber of things, however, the most common are `r` for reading, `w` for\nwriting, and `a` for appending. It should be noted, if you are opening a file\nto read using `r` then that file MUST exist, otherwise `fopen` will return \n`NULL`, something you should check for. Writing with `w` will create an empty \nfile even if one of the same name already exists, so be careful! Appending \nwith `a` will append data to the end of an already present file, or create an \nempty file if `filename` doesn't exist.\n        \n</p>"
            },
            {
              "block": "fgets(s, i, fp);",
              "context": "blockItem",
              "title": "<b>get the next string from a file</b></br>\n<p>\n`fgets` reads in, at most, `i` characters from file `fp`, storing them \ntemporarily in buffer `s`.\n        \n</p>"
            },
            {
              "block": "fgetc(fp);",
              "context": "blockItem",
              "title": "<b>get the next character from a file</b></br>\n<p>\nGets the next character from a file.\n\n</p>"
            },
            {
              "block": "feof(fp);",
              "context": "blockItem",
              "title": "<b>checks whether pointer to file has reached the end of the file</b></br>\n<p>\nChecks whether pointer to file has reached the end of the file.\n\n</p>"
            },
            {
              "block": "fclose(fp);",
              "context": "blockItem",
              "title": "<b>close an open file</b></br>\n<p>\nCloses the current file pointed to by file pointer `fp`.\n\n</p>"
            },
            {
              "block": "clearerr(stream);",
              "context": "blockItem",
              "title": "<b>check and reset stream status</b></br>\n<p>The function clearerr() clears the end-of-file and error indicators for the stream pointed to by `stream`.</p>"
            },
            {
              "block": "ferror(stream);",
              "context": "blockItem",
              "title": "<b>check and reset stream status</b></br>\n<p>The function ferror() tests the error indicator for the stream pointed to by `stream`, returning nonzero if it is set. The error indicator can be reset only by the clearerr() function.</p>"
            },
            {
              "block": "fflush(stream);",
              "context": "blockItem",
              "title": "<b>flush a stream</b></br>\n<p>For output streams, fflush() forces a write of all user-space buffered data for the given output or update `stream` via the stream's underlying write function. For input streams, fflush() discards any buffered data that has been fetched from the underlying file, but has not been consumed by the application. The open status of the stream is unaffected.</p>"
            },
            {
              "block": "fgetpos(stream, pos);",
              "context": "blockItem",
              "title": "<b>reposition a stream</b></br>\n<p>The fgetpos() and fsetpos() functions are alternate interfaces equivalent to ftell() and fseek() (with `whence` set to \\*SEEK_SET\\*), setting and storing the current value of the file offset into or from the object referenced by `pos`. On some non-UNIX systems, an `fpos_t` object may be a complex object and these routines may be the only way to portably reposition a text stream.</p>"
            },
            {
              "block": "fsetpos(stream, pos);",
              "context": "blockItem",
              "title": "<b>reposition a stream</b></br>\n<p>The fgetpos() and fsetpos() functions are alternate interfaces equivalent to ftell() and fseek() (with `whence` set to \\*SEEK_SET\\*), setting and storing the current value of the file offset into or from the object referenced by `pos`. On some non-UNIX systems, an `fpos_t` object may be a complex object and these routines may be the only way to portably reposition a text stream.</p>"
            },
            {
              "block": "ftell(stream);",
              "context": "blockItem",
              "title": "<b>reposition a stream</b></br>\n<p>The ftell() function obtains the current value of the file position indicator for the stream pointed to by `stream`.</p>"
            },
            {
              "block": "getc(stream);",
              "context": "blockItem",
              "title": "<b>input of characters and strings</b></br>\n<p>getc() is equivalent to fgetc() except that it may be implemented as a macro which evaluates `stream` more than once.</p>"
            },
            {
              "block": "getchar();",
              "context": "blockItem",
              "title": "<b>input of characters and strings</b></br>\n<p>getchar() is equivalent to \\*getc(\\*_stdin_\\*)\\*.</p>"
            },
            {
              "block": "gets(s);",
              "context": "blockItem",
              "title": "<b>input of characters and strings</b></br>\n<p>gets() reads a line from _stdin_ into the buffer pointed to by `s` until either a terminating newline or \\*EOF\\*, which it replaces with a null byte ('\\0'). No check for buffer overrun is performed (see BUGS below).</p>"
            },
            {
              "block": "perror(s);",
              "context": "blockItem",
              "title": "<b>print a system error message</b></br>\n<p>The routine perror() produces a message on the standard error output, describing the last error encountered during a call to a system or library function. First (if `s` is not NULL and _\\*s_ is not a null byte ('\\0')) the argument string `s` is printed, followed by a colon and a blank. Then the message and a new-line.</p>"
            },
            {
              "block": "putc(c, stream);",
              "context": "blockItem",
              "title": "<b>output of characters and strings</b></br>\n<p>putc() is equivalent to fputc() except that it may be implemented as a macro which evaluates `stream` more than once.</p>"
            },
            {
              "block": "putchar(c);",
              "context": "blockItem",
              "title": "<b>output of characters and strings</b></br>\n<p>\\*putchar(\\*`c`\\*);\\* is equivalent to \\*putc(\\*`c`\\*,\\*_stdout_\\*).\\*</p>"
            },
            {
              "block": "puts(s);",
              "context": "blockItem",
              "title": "<b>output of characters and strings</b></br>\n<p>puts() writes the string `s` and a trailing newline to _stdout_.</p>"
            },
            {
              "block": "remove(pathname);",
              "context": "blockItem",
              "title": "<b>remove a file or directory</b></br>\n<p>remove() deletes a name from the file system. It calls unlink(2) for files, and rmdir(2) for directories.</p>"
            },
            {
              "block": "rewind(stream);",
              "context": "blockItem",
              "title": "<b>reposition a stream</b></br>\n<p>The rewind() function sets the file position indicator for the stream pointed to by `stream` to the beginning of the file. It is equivalent to:</p>"
            },
            {
              "block": "setbuf(stream, buf);",
              "context": "blockItem",
              "title": "<b>stream buffering operations</b></br>\n<p>The setbuffer() function is the same, except that the size of the buffer is up to the caller, rather than being determined by the default \\*BUFSIZ\\*. The setlinebuf() function is exactly equivalent to the call:</p>"
            },
            {
              "block": "setvbuf(stream, buf, mode, size);",
              "context": "blockItem",
              "title": "<b>stream buffering operations</b></br>\n<p>setvbuf(stream, buf, buf ? _IOFBF : _IONBF, BUFSIZ);</p>"
            },
            {
              "block": "snprintf(str, size, format, ___);",
              "context": "blockItem",
              "title": "<b>formatted output conversion</b></br>\n<p>The functions snprintf() and vsnprintf() write at most `size` bytes (including the terminating null byte ('\\0')) to `str`.</p>"
            },
            {
              "block": "sscanf(str, format, ___);",
              "context": "blockItem",
              "title": "<b>input format conversion</b></br>\n<p>The scanf() function reads input from the standard input stream _stdin_, fscanf() reads input from the stream pointer `stream`, and sscanf() reads its input from the character string pointed to by `str`.</p>"
            },
            {
              "block": "ungetc(c, stream);",
              "context": "blockItem",
              "title": "<b>input of characters and strings</b></br>\n<p>ungetc() pushes `c` back to `stream`, cast to _unsigned char_, where it is available for subsequent read operations. Pushed-back characters will be returned in reverse order; only one pushback is guaranteed.</p>"
            },
            {
              "block": "vfprintf(stream, format, ap);",
              "context": "blockItem",
              "title": "<b>formatted output conversion</b></br>\n<p>The functions vprintf(), vfprintf(), vsprintf(), vsnprintf() are equivalent to the functions printf(), fprintf(), sprintf(), snprintf(), respectively, except that they are called with a _va_list_ instead of a variable number of arguments. These functions do not call the _va_end_ macro. Because they invoke the _va_arg_ macro, the value of `ap` is undefined after the call. See stdarg(3).</p>"
            },
            {
              "block": "vfscanf(stream, format, ap);",
              "context": "blockItem",
              "title": "<b>input format conversion</b></br>\n<p>The vfscanf() function is analogous to vfprintf(3) and reads input from the stream pointer `stream` using a variable argument list of pointers (see stdarg(3). The vscanf() function scans a variable argument list from the standard input and the vsscanf() function scans it from a string; these are analogous to the vprintf(3) and vsprintf(3) functions respectively.</p>"
            },
            {
              "block": "vprintf(format, ap);",
              "context": "blockItem",
              "title": "<b>formatted output conversion</b></br>\n<p>The functions vprintf(), vfprintf(), vsprintf(), vsnprintf() are equivalent to the functions printf(), fprintf(), sprintf(), snprintf(), respectively, except that they are called with a _va_list_ instead of a variable number of arguments. These functions do not call the _va_end_ macro. Because they invoke the _va_arg_ macro, the value of `ap` is undefined after the call. See stdarg(3).</p>"
            },
            {
              "block": "vscanf(format, ap);",
              "context": "blockItem",
              "title": "<b>input format conversion</b></br>\n<p>The vfscanf() function is analogous to vfprintf(3) and reads input from the stream pointer `stream` using a variable argument list of pointers (see stdarg(3). The vscanf() function scans a variable argument list from the standard input and the vsscanf() function scans it from a string; these are analogous to the vprintf(3) and vsprintf(3) functions respectively.</p>"
            },
            {
              "block": "vsnprintf(str, size, format, ap);",
              "context": "blockItem",
              "title": "<b>formatted output conversion</b></br>\n<p>The functions snprintf() and vsnprintf() write at most `size` bytes (including the terminating null byte ('\\0')) to `str`.</p>"
            },
            {
              "block": "vsprintf(str, format, ap);",
              "context": "blockItem",
              "title": "<b>formatted output conversion</b></br>\n<p>The functions vprintf(), vfprintf(), vsprintf(), vsnprintf() are equivalent to the functions printf(), fprintf(), sprintf(), snprintf(), respectively, except that they are called with a _va_list_ instead of a variable number of arguments. These functions do not call the _va_end_ macro. Because they invoke the _va_arg_ macro, the value of `ap` is undefined after the call. See stdarg(3).</p>"
            },
            {
              "block": "vsscanf(str, format, ap);",
              "context": "blockItem",
              "title": "<b>input format conversion</b></br>\n<p>The vfscanf() function is analogous to vfprintf(3) and reads input from the stream pointer `stream` using a variable argument list of pointers (see stdarg(3). The vscanf() function scans a variable argument list from the standard input and the vsscanf() function scans it from a string; these are analogous to the vprintf(3) and vsprintf(3) functions respectively.</p>"
            }
          ]
        },
        {
          "name": "stdlib.h",
          "color": "blue",
          "blocks": [
            {
              "block": "#include <stdlib.h>",
              "context": "compilationUnit"
            },
            {
              "block": "srand48(seedval);",
              "context": "blockItem",
              "title": "<b>seeds the pseudorandom generator drand48()</b></br>\n<p>\nThe function `srand48()` is used to seed, or initialize, the internal buffer of functions such as `drand48()`. You normally seed `drand48()` with \nsomething like `time(NULL)` since this value will always change. If you were to simply call `drand48()` without seeding it, you'd get the same string\nof 'random' doubles back.</p>"
            },
            {
              "block": "srand(seed);",
              "context": "blockItem",
              "title": "<b>seed the pseudorandom generator `rand`</b></br>\n<p>\nThe thing about the function `rand` is it will generate a \"random\" integer,\nhowever, if you seed it with the same number, you will get the same \"random\"\nsequence of numbers. Therefore, we want to seed `rand` with something that\nalways changes. Often, it makes sense to seed `rand` with `time`, as it\nis a variable that will always be changing. We seed the `rand` function with\n`srand`.</p>"
            },
            {
              "block": "realloc(ptr, size);",
              "context": "blockItem",
              "title": "<b>reallocate memory previously allocated</b></br>\n<p>\nReallocate memory that was previously allocated with `calloc` or `malloc`. You\ntake the memory block pointed to by `ptr` and give it a new `size`.\n\n</p>"
            },
            {
              "block": "rand();",
              "context": "blockItem",
              "title": "<b>returns a pseudorandom integer</b></br>\n<p>\nThe function rand() returns a pseudorandom integer between zero and RAND_MAX.</p>"
            },
            {
              "block": "malloc(size);",
              "context": "blockItem",
              "title": "<b>allocate memory</b></br>\n<p>\nAllocate `size` bytes of memory. Unlike `calloc`, `malloc` will not pre-set all\nallocated memory to zero.</p>"
            },
            {
              "block": "free(ptr);",
              "context": "blockItem",
              "title": "<b>free dynamically allocated memory</b></br>\n<p>\nFree takes a pointer to a block of memory on the heap and frees it for future\nuse. Whenever you dynamically allocate memory with something like `calloc`, \n`malloc`,or `realloc`, you have to, when done with the memory, `free` it. \nOtherwise, you'll end up with memory leaks.</p>"
            },
            {
              "block": "drand48();",
              "context": "blockItem",
              "title": "<b>returns a pseudorandom integer using 48-bit integer arithmetic</b></br>\n<p>\nThe function `drand48()` returns a pseudorandom non-negative double-precision floating-point value over the interval [0.0, 1.0).</p>"
            },
            {
              "block": "calloc(items, size);",
              "context": "blockItem",
              "title": "<b>allocate memory and set it to zero</b></br>\n<p>\n`calloc` allocates the requested memory and sets it all to zero. So, it will\nallocate  `size` bytes `items` number of times. For example, if `size` is\n4 bytes, and `items` 10, then `calloc` will allocate a total of 40 bytes. \nThis differs from `malloc` which doesn't set the memory to zero.</p>"
            },
            {
              "block": "atoi(str);",
              "context": "blockItem",
              "title": "<b>convert a string to an integer</b></br>\n<p>\nUse to convert some string `str` to an integer.\n\n</p>"
            },
            {
              "block": "abort();",
              "context": "blockItem",
              "title": "<b>cause abnormal process termination</b></br>\n<p>The abort() first unblocks the `SIGABRT` signal, and then raises that signal for the calling process. This results in the abnormal termination of the process unless the `SIGABRT` signal is caught and the signal handler does not return (see longjmp(3)).</p>"
            },
            {
              "block": "abs(j);",
              "context": "blockItem",
              "title": "<b>compute the absolute value of an integer</b></br>\n<p>The abs() function computes the absolute value of the integer argument `j`. The labs(), llabs() and imaxabs() functions compute the absolute value of the argument `j` of the appropriate integer type for the function.</p>"
            },
            {
              "block": "atexit(function);",
              "context": "blockItem",
              "title": "<b>register a function to be called at normal process termination</b></br>\n<p>The atexit() function registers the given `function` to be called at normal process termination, either via exit(3) or via return from the program's _main_(). Functions so registered are called in the reverse order of their registration; no arguments are passed.</p>"
            },
            {
              "block": "atof(nptr);",
              "context": "blockItem",
              "title": "<b>convert a string to a double</b></br>\n<p>The atof() function converts the initial portion of the string pointed to by `nptr` to _double_. The behavior is the same as</p>"
            },
            {
              "block": "atol(nptr);",
              "context": "blockItem",
              "title": "<b>convert a string to an integer</b></br>\n<p>The atol() and atoll() functions behave the same as atoi(), except that they convert the initial portion of the string to their return type of _long_ or _long long_. atoq() is an obsolete name for atoll().</p>"
            },
            {
              "block": "atoll(nptr);",
              "context": "blockItem",
              "title": "<b>convert a string to an integer</b></br>\n<p>The atol() and atoll() functions behave the same as atoi(), except that they convert the initial portion of the string to their return type of _long_ or _long long_. atoq() is an obsolete name for atoll().</p>"
            },
            {
              "block": "bsearch(key, base, nmemb, size, compar);",
              "context": "blockItem",
              "title": "<b>binary search of a sorted array</b></br>\n<p>The bsearch() function searches an array of `nmemb` objects, the initial member of which is pointed to by `base`, for a member that matches the object pointed to by `key`. The size of each member of the array is specified by `size`.</p>"
            },
            {
              "block": "div(numerator, denominator);",
              "context": "blockItem",
              "title": "<b>compute quotient and remainder of an integer division</b></br>\n<p>The div() function computes the value `numerator`/`denominator` and returns the quotient and remainder in a structure named `div_t` that contains two integer members (in unspecified order) named _quot_ and _rem_. The quotient is rounded toward zero. The result satisfies _quot_\\*`denominator`+_rem_ = `numerator`.</p>"
            },
            {
              "block": "exit(status);",
              "context": "blockItem",
              "title": "<b>cause normal process termination</b></br>\n<p>The exit() function causes normal process termination and the value of _status & 0377_ is returned to the parent (see wait(2)).</p>"
            },
            {
              "block": "getenv(name);",
              "context": "blockItem",
              "title": "<b>get an environment variable</b></br>\n<p>The getenv() function searches the environment list to find the environment variable `name`, and returns a pointer to the corresponding _value_ string.</p>"
            },
            {
              "block": "labs(j);",
              "context": "blockItem",
              "title": "<b>compute the absolute value of an integer</b></br>\n<p>The abs() function computes the absolute value of the integer argument `j`. The labs(), llabs() and imaxabs() functions compute the absolute value of the argument `j` of the appropriate integer type for the function.</p>"
            },
            {
              "block": "ldiv(numerator, denominator);",
              "context": "blockItem",
              "title": "<b>compute quotient and remainder of an integer division</b></br>\n<p>The ldiv(), lldiv(), and imaxdiv() functions do the same, dividing numbers of the indicated type and returning the result in a structure of the indicated name, in all cases with fields _quot_ and _rem_ of the same type as the function arguments.</p>"
            },
            {
              "block": "llabs(j);",
              "context": "blockItem",
              "title": "<b>compute the absolute value of an integer</b></br>\n<p>The abs() function computes the absolute value of the integer argument `j`. The labs(), llabs() and imaxabs() functions compute the absolute value of the argument `j` of the appropriate integer type for the function.</p>"
            },
            {
              "block": "lldiv(numerator, denominator);",
              "context": "blockItem",
              "title": "<b>compute quotient and remainder of an integer division</b></br>\n<p>The ldiv(), lldiv(), and imaxdiv() functions do the same, dividing numbers of the indicated type and returning the result in a structure of the indicated name, in all cases with fields _quot_ and _rem_ of the same type as the function arguments.</p>"
            },
            {
              "block": "mblen(s, n);",
              "context": "blockItem",
              "title": "<b>determine number of bytes in next multibyte character</b></br>\n<p>If `s` is a NULL pointer, the mblen() function  resets the shift state, known to only this function, to the initial state, and returns nonzero if the encoding has nontrivial shift state, or zero if the encoding is stateless.</p>"
            },
            {
              "block": "mbstowcs(dest, src, n);",
              "context": "blockItem",
              "title": "<b>convert a multibyte string to a wide-character string</b></br>\n<p>If `dest` is not a NULL pointer, the mbstowcs() function converts the multibyte string `src` to a wide-character string starting at `dest`. At most `n` wide characters are written to `dest`. The conversion starts in the initial state. The conversion can stop for three reasons:</p>"
            },
            {
              "block": "mbtowc(pwc, s, n);",
              "context": "blockItem",
              "title": "<b>convert a multibyte sequence to a wide character</b></br>\n<p>A different case is when `s` is not NULL but `pwc` is NULL. In this case the mbtowc() function behaves as above, except that it does not store the converted wide character in memory.</p>"
            },
            {
              "block": "qsort(base, nmemb, size, compar);",
              "context": "blockItem",
              "title": "<b>sort an array</b></br>\n<p>The qsort() function sorts an array with `nmemb` elements of size `size`. The `base` argument points to the start of the array.</p>"
            },
            {
              "block": "strtod(nptr, endptr);",
              "context": "blockItem",
              "title": "<b>convert ASCII string to floating-point number</b></br>\n<p>The strtod(), strtof(), and strtold() functions convert the initial portion of the string pointed to by `nptr` to _double_, _float_, and _long double_ representation, respectively.</p>"
            },
            {
              "block": "strtof(nptr, endptr);",
              "context": "blockItem",
              "title": "<b>convert ASCII string to floating-point number</b></br>\n<p>The strtod(), strtof(), and strtold() functions convert the initial portion of the string pointed to by `nptr` to _double_, _float_, and _long double_ representation, respectively.</p>"
            },
            {
              "block": "strtol(nptr, endptr, base);",
              "context": "blockItem",
              "title": "<b>convert a string to a long integer</b></br>\n<p>The strtol() function converts the initial part of the string in `nptr` to a long integer value according to the given `base`, which must be between 2 and 36 inclusive, or be the special value 0.</p>"
            },
            {
              "block": "strtold(nptr, endptr);",
              "context": "blockItem",
              "title": "<b>convert ASCII string to floating-point number</b></br>\n<p>The strtod(), strtof(), and strtold() functions convert the initial portion of the string pointed to by `nptr` to _double_, _float_, and _long double_ representation, respectively.</p>"
            },
            {
              "block": "strtoll(nptr, endptr, base);",
              "context": "blockItem",
              "title": "<b>convert a string to a long integer</b></br>\n<p>The strtoll() function works just like the strtol() function but returns a long long integer value.</p>"
            },
            {
              "block": "strtoul(nptr, endptr, base);",
              "context": "blockItem",
              "title": "<b>convert a string to an unsigned long integer</b></br>\n<p>The strtoul() function converts the initial part of the string in `nptr` to an _unsigned long int_ value according to the given `base`, which must be between 2 and 36 inclusive, or be the special value 0.</p>"
            },
            {
              "block": "strtoull(nptr, endptr, base);",
              "context": "blockItem",
              "title": "<b>convert a string to an unsigned long integer</b></br>\n<p>The strtoull() function works just like the strtoul() function but returns an _unsigned long long int_ value.</p>"
            },
            {
              "block": "system(command);",
              "context": "blockItem",
              "title": "<b>execute a shell command</b></br>\n<p>system() executes a command specified in `command` by calling `/bin/sh -c` `command`, and returns after the command has been completed. During execution of the command, `SIGCHLD` will be blocked, and `SIGINT` and `SIGQUIT` will be ignored.</p>"
            },
            {
              "block": "wcstombs(dest, src, n);",
              "context": "blockItem",
              "title": "<b>convert a wide-character string to a multibyte string</b></br>\n<p>If `dest` is not a NULL pointer, the wcstombs() function converts the wide-character string `src` to a multibyte string starting at `dest`. At most `n` bytes are written to `dest`. The conversion starts in the initial state. The conversion can stop for three reasons:</p>"
            },
            {
              "block": "wctomb(s, wc);",
              "context": "blockItem",
              "title": "<b>convert a wide character to a multibyte sequence</b></br>\n<p>If `s` is NULL, the wctomb() function  resets the shift state, known only to this function, to the initial state, and returns nonzero if the encoding has nontrivial shift state, or zero if the encoding is stateless.</p>"
            }
          ]
        },
        {
          "name": "string.h",
          "color": "blue",
          "blocks": [
            {
              "block": "#include <string.h>",
              "context": "compilationUnit"
            },
            {
              "block": "strlen(str);",
              "context": "blockItem",
              "title": "<b>return length of a string</b></br>\n<p>\nReturn the length of a string.\n \n</p>"
            },
            {
              "block": "strcpy(destination, source);",
              "context": "blockItem",
              "title": "<b>copy a string</b></br>\n<p>\n`strcpy` copys string `source` into string `destination`.</p>"
            },
            {
              "block": "strcmp(str1, str2);",
              "context": "blockItem",
              "title": "<b>compare two strings</b></br>\n<p>\n`strcmp` compares two strings: `str1` and `str2`.</p>"
            },
            {
              "block": "memchr(s, c, n);",
              "context": "blockItem",
              "title": "<b>scan memory for a character</b></br>\n<p>The memchr() function scans the initial `n` bytes of the memory area pointed to by `s` for the first instance of `c`. Both `c` and the bytes of the memory area pointed to by `s` are interpreted as _unsigned char_.</p>"
            },
            {
              "block": "memcmp(s1, s2, n);",
              "context": "blockItem",
              "title": "<b>compare memory areas</b></br>\n<p>The memcmp() function compares the first `n` bytes (each interpreted as _unsigned char_) of the memory areas `s1` and `s2`.</p>"
            },
            {
              "block": "memcpy(dest, src, n);",
              "context": "blockItem",
              "title": "<b>copy memory area</b></br>\n<p>The memcpy() function copies `n` bytes from memory area `src` to memory area `dest`. The memory areas must not overlap. Use memmove(3) if the memory areas do overlap.</p>"
            },
            {
              "block": "memmove(dest, src, n);",
              "context": "blockItem",
              "title": "<b>copy memory area</b></br>\n<p>The memmove() function copies `n` bytes from memory area `src` to memory area `dest`. The memory areas may overlap: copying takes place as though the bytes in `src` are first copied into a temporary array that does not overlap `src` or `dest`, and the bytes are then copied from the temporary array to `dest`.</p>"
            },
            {
              "block": "memset(s, c, n);",
              "context": "blockItem",
              "title": "<b>fill memory with a constant byte</b></br>\n<p>The memset() function fills the first `n` bytes of the memory area pointed to by `s` with the constant byte `c`.</p>"
            },
            {
              "block": "strcat(dest, src);",
              "context": "blockItem",
              "title": "<b>concatenate two strings</b></br>\n<p>The strcat() function appends the `src` string to the `dest` string, overwriting the terminating null byte ('\\0') at the end of `dest`, and then adds a terminating null byte. The strings may not overlap, and the `dest` string must have enough space for the result. If `dest` is not large enough, program behavior is unpredictable; _buffer overruns are a favorite avenue for attacking secure programs_.</p>"
            },
            {
              "block": "strchr(s, c);",
              "context": "blockItem",
              "title": "<b>locate character in string</b></br>\n<p>The strchr() function returns a pointer to the first occurrence of the character `c` in the string `s`.</p>"
            },
            {
              "block": "strcoll(s1, s2);",
              "context": "blockItem",
              "title": "<b>compare two strings using the current locale</b></br>\n<p>The strcoll() function compares the two strings `s1` and `s2`. It returns an integer less than, equal to, or greater than zero if `s1` is found, respectively, to be less than, to match, or be greater than `s2`. The comparison is based on strings interpreted as appropriate for the program's current locale for category \\*LC_COLLATE\\*.  (See setlocale(3).)</p>"
            },
            {
              "block": "strcspn(s, reject);",
              "context": "blockItem",
              "title": "<b>search a string for a set of bytes</b></br>\n<p>The strcspn() function calculates the length of the initial segment of `s` which consists entirely of bytes not in `reject`.</p>"
            },
            {
              "block": "strerror(errnum);",
              "context": "blockItem",
              "title": "<b>return string describing error number</b></br>\n<p>The strerror() function returns a pointer to a string that describes the error code passed in the argument `errnum`, possibly using the `LC_MESSAGES` part of the current locale to select the appropriate language. (For example, if `errnum` is `EINVAL`, the returned description will \"Invalid argument\".) This string must not be modified by the application, but may be modified by a subsequent call to strerror(). No library function, including perror(3), will modify this string.</p>"
            },
            {
              "block": "strncat(dest, src, n);",
              "context": "blockItem",
              "title": "<b>concatenate two strings</b></br>\n<p>The strncat() function is similar, except that</p>"
            },
            {
              "block": "strncmp(s1, s2, n);",
              "context": "blockItem",
              "title": "<b>compare two strings</b></br>\n<p>The strncmp() function is similar, except it compares the only first (at most) `n` bytes of `s1` and `s2`.</p>"
            },
            {
              "block": "strncpy(dest, src, n);",
              "context": "blockItem",
              "title": "<b>copy a string</b></br>\n<p>The strncpy() function is similar, except that at most `n` bytes of `src` are copied. \\*Warning\\*: If there is no null byte among the first `n` bytes of `src`, the string placed in `dest` will not be null-terminated.</p>"
            },
            {
              "block": "strpbrk(s, accept);",
              "context": "blockItem",
              "title": "<b>search a string for any of a set of bytes</b></br>\n<p>The strpbrk() function locates the first occurrence in the string `s` of any of the bytes in the string `accept`.</p>"
            },
            {
              "block": "strrchr(s, c);",
              "context": "blockItem",
              "title": "<b>locate character in string</b></br>\n<p>The strrchr() function returns a pointer to the last occurrence of the character `c` in the string `s`.</p>"
            },
            {
              "block": "strspn(s, accept);",
              "context": "blockItem",
              "title": "<b>search a string for a set of bytes</b></br>\n<p>The strspn() function calculates the length (in bytes) of the initial segment of `s` which consists entirely of bytes in `accept`.</p>"
            },
            {
              "block": "strstr(haystack, needle);",
              "context": "blockItem",
              "title": "<b>locate a substring</b></br>\n<p>The strstr() function finds the first occurrence of the substring `needle` in the string `haystack`. The terminating null bytes ('\\0') are not compared.</p>"
            },
            {
              "block": "strtok(str, delim);",
              "context": "blockItem",
              "title": "<b>extract tokens from strings</b></br>\n<p>The strtok() function parses a string into a sequence of tokens. On the first call to strtok() the string to be parsed should be specified in `str`. In each subsequent call that should parse the same string, `str` should be NULL.</p>"
            },
            {
              "block": "strxfrm(dest, src, n);",
              "context": "blockItem",
              "title": "<b>string transformation</b></br>\n<p>The strxfrm() function transforms the `src` string into a form such that the result of strcmp(3) on two strings that have been transformed with strxfrm() is the same as the result of strcoll(3) on the two strings before their transformation. The first `n` bytes of the transformed string are placed in `dest`. The transformation is based on the program's current locale for category \\*LC_COLLATE\\*.  (See setlocale(3)).</p>"
            }
          ]
        },
        {
          "name": "math.h",
          "color": "blue",
          "blocks": [
            {
              "block": "#include <math.h>",
              "context": "compilationUnit"
            },
            {
              "block": "round(x);",
              "context": "blockItem",
              "title": "<b>rounds value</b></br>\n<p>\nRounds the `double` `x` to the nearest integer value.\n\n</p>"
            },
            {
              "block": "floor(x);",
              "context": "blockItem",
              "title": "<b>rounds down value</b></br>\n<p>\nRounds `x` down.\n\n</p>"
            },
            {
              "block": "ceil(x);",
              "context": "blockItem",
              "title": "<b>rounds up value</b></br>\n<p>\nRounds `x` upward.\n\n</p>"
            },
            {
              "block": "acos(x);",
              "context": "blockItem",
              "title": "<b>arc cosine function</b></br>\n<p>The acos() function calculates the arc cosine of `x`; that is the value whose cosine is `x`.</p>"
            },
            {
              "block": "acosh(x);",
              "context": "blockItem",
              "title": "<b>inverse hyperbolic cosine function</b></br>\n<p>The acosh() function calculates the inverse hyperbolic cosine of `x`; that is the value whose hyperbolic cosine is `x`.</p>"
            },
            {
              "block": "asin(x);",
              "context": "blockItem",
              "title": "<b>arc sine function</b></br>\n<p>The asin() function calculates the principal value of the arc sine of `x`; that is the value whose sine is `x`.</p>"
            },
            {
              "block": "asinh(x);",
              "context": "blockItem",
              "title": "<b>inverse hyperbolic sine function</b></br>\n<p>The asinh() function calculates the inverse hyperbolic sine of `x`; that is the value whose hyperbolic sine is `x`.</p>"
            },
            {
              "block": "atan(x);",
              "context": "blockItem",
              "title": "<b>arc tangent function</b></br>\n<p>The atan() function calculates the principal value of the arc tangent of `x`; that is the value whose tangent is `x`.</p>"
            },
            {
              "block": "atan2(y, x);",
              "context": "blockItem",
              "title": "<b>arc tangent function of two variables</b></br>\n<p>The atan2() function calculates the principal value of the arc tangent of _y/x_, using the signs of the two arguments to determine the quadrant of the result.</p>"
            },
            {
              "block": "atanh(x);",
              "context": "blockItem",
              "title": "<b>inverse hyperbolic tangent function</b></br>\n<p>The atanh() function calculates the inverse hyperbolic tangent of `x`; that is the value whose hyperbolic tangent is `x`.</p>"
            },
            {
              "block": "copysign(x, y);",
              "context": "blockItem",
              "title": "<b>copy sign of a number</b></br>\n<p>The copysign() functions return a value whose absolute value matches that of `x`, but whose sign bit matches that of `y`.</p>"
            },
            {
              "block": "cos(x);",
              "context": "blockItem",
              "title": "<b>cosine function</b></br>\n<p>The cos() function returns the cosine of `x`, where `x` is given in radians.</p>"
            },
            {
              "block": "cosh(x);",
              "context": "blockItem",
              "title": "<b>hyperbolic cosine function</b></br>\n<p>The cosh() function returns the hyperbolic cosine of `x`, which is defined mathematically as:</p>"
            },
            {
              "block": "erf(x);",
              "context": "blockItem",
              "title": "<b>error function</b></br>\n<p>erf(x) = 2/sqrt(pi)\\* integral from 0 to x of exp(-t\\*t) dt</p>"
            },
            {
              "block": "erfc(x);",
              "context": "blockItem",
              "title": "<b>complementary error function</b></br>\n<p>The erfc() function returns the complementary error function of `x`, that is, 1.0 - erf(x).</p>"
            },
            {
              "block": "exp(x);",
              "context": "blockItem",
              "title": "<b>base-e exponential function</b></br>\n<p>The exp() function returns the value of e (the base of natural logarithms) raised to the power of `x`.</p>"
            },
            {
              "block": "exp2(x);",
              "context": "blockItem",
              "title": "<b>base-2 exponential function</b></br>\n<p>The exp2() function returns the value of 2 raised to the power of `x`.</p>"
            },
            {
              "block": "expm1(x);",
              "context": "blockItem",
              "title": "<b>exponential minus 1</b></br>\n<p>_expm1(x)_ returns a value equivalent to</p>"
            },
            {
              "block": "fabs(x);",
              "context": "blockItem",
              "title": "<b>absolute value of floating-point number</b></br>\n<p>The fabs() functions return the absolute value of the floating-point number `x`.</p>"
            },
            {
              "block": "fdim(x, y);",
              "context": "blockItem",
              "title": "<b>positive difference</b></br>\n<p>\n \nThese functions return the positive difference, max(`x`-`y`,0), between their arguments.\n </p>"
            },
            {
              "block": "fma(x, y, z);",
              "context": "blockItem",
              "title": "<b>floating-point multiply and add</b></br>\n<p>The fma() function computes `x` \\* `y` + `z`. The result is rounded as one ternary operation according to the current rounding mode (see fenv(3)).</p>"
            },
            {
              "block": "fmax(x, y);",
              "context": "blockItem",
              "title": "<b>determine maximum of two floating-point numbers</b></br>\n<p>\n \nThese functions return the larger value of `x` and `y`.\n </p>"
            },
            {
              "block": "fmin(x, y);",
              "context": "blockItem",
              "title": "<b>determine minimum of two floating-point numbers</b></br>\n<p>\n \nThese functions the lesser value of `x` and `y`.\n </p>"
            },
            {
              "block": "fmod(x, y);",
              "context": "blockItem",
              "title": "<b>floating-point remainder function</b></br>\n<p>The fmod() function computes the floating-point remainder of dividing `x` by `y`. The return value is `x` - _n_ \\* `y`, where _n_ is the quotient of `x` / `y`, rounded toward zero to an integer.</p>"
            },
            {
              "block": "fpclassify(x);",
              "context": "blockItem",
              "title": "<b>floating-point classification macros</b></br>\n<p>returns a nonzero value if (fpclassify(x) == FP_NORMAL)</p>"
            },
            {
              "block": "frexp(x, exp);",
              "context": "blockItem",
              "title": "<b>convert floating-point number to fractional and integral components</b></br>\n<p>The frexp() function is used to split the number `x` into a normalized fraction and an exponent which is stored in `exp`.</p>"
            },
            {
              "block": "ilogb(x);",
              "context": "blockItem",
              "title": "<b>get integer exponent of a floating-point value</b></br>\n<p>\n \nThese functions return the exponent part of their argument as a signed integer. When no error occurs, these functions are equivalent to the corresponding logb(3) functions, cast to _int_.\n </p>"
            },
            {
              "block": "isfinite(x);",
              "context": "blockItem",
              "title": "<b>floating-point classification macros</b></br>\n<p>`\\*isfinite(\\*_x_\\*)\\*`    </p>"
            },
            {
              "block": "isgreater(x, y);",
              "context": "blockItem",
              "title": "<b>floating-point relational tests without exception for NaN</b></br>\n<p>`isgreater()`    </p>"
            },
            {
              "block": "isgreaterequal(x, y);",
              "context": "blockItem",
              "title": "<b>floating-point relational tests without exception for NaN</b></br>\n<p>`isgreaterequal()`    </p>"
            },
            {
              "block": "isinf(x);",
              "context": "blockItem",
              "title": "<b>floating-point classification macros</b></br>\n<p>`\\*isinf(\\*_x_\\*)\\*`    </p>"
            },
            {
              "block": "isless(x, y);",
              "context": "blockItem",
              "title": "<b>floating-point relational tests without exception for NaN</b></br>\n<p>`isless()`    </p>"
            },
            {
              "block": "islessequal(x, y);",
              "context": "blockItem",
              "title": "<b>floating-point relational tests without exception for NaN</b></br>\n<p>`islessequal()`    </p>"
            },
            {
              "block": "islessgreater(x, y);",
              "context": "blockItem",
              "title": "<b>floating-point relational tests without exception for NaN</b></br>\n<p>`islessgreater()`    </p>"
            },
            {
              "block": "isnan(x);",
              "context": "blockItem",
              "title": "<b>floating-point classification macros</b></br>\n<p>`\\*isnan(\\*_x_\\*)\\*`    </p>"
            },
            {
              "block": "isnormal(x);",
              "context": "blockItem",
              "title": "<b>floating-point classification macros</b></br>\n<p>`\\*isnormal(\\*_x_\\*)\\*`    </p>"
            },
            {
              "block": "isunordered(x, y);",
              "context": "blockItem",
              "title": "<b>floating-point relational tests without exception for NaN</b></br>\n<p>`isunordered()`    </p>"
            },
            {
              "block": "ldexp(x, exp);",
              "context": "blockItem",
              "title": "<b>multiply floating-point number by integral power of 2</b></br>\n<p>The ldexp() function returns the result of multiplying the floating-point number `x` by 2 raised to the power `exp`.</p>"
            },
            {
              "block": "llrint(x);",
              "context": "blockItem",
              "title": "<b>round to nearest integer</b></br>\n<p>\n \nThese functions round their argument to the nearest integer value, using the current rounding direction (see fesetround(3)).\n  \nNote that unlike rint(3), etc., the return type of these functions differs from that of their arguments.\n </p>"
            },
            {
              "block": "llround(x);",
              "context": "blockItem",
              "title": "<b>round to nearest integer, away from zero</b></br>\n<p>\n \nThese functions round their argument to the nearest integer value, rounding away from zero, regardless of the current rounding direction (see fenv(3)).\n  \nNote that unlike round(3), ceil(3), etc., the return type of these functions differs from that of their arguments.\n </p>"
            },
            {
              "block": "log(x);",
              "context": "blockItem",
              "title": "<b>natural logarithmic function</b></br>\n<p>The log() function returns the natural logarithm of `x`.</p>"
            },
            {
              "block": "log10(x);",
              "context": "blockItem",
              "title": "<b> base-10 logarithmic function</b></br>\n<p>The log10() function returns the base 10 logarithm of `x`.</p>"
            },
            {
              "block": "log1p(x);",
              "context": "blockItem",
              "title": "<b> logarithm of 1 plus argument</b></br>\n<p>_log1p(x)_ returns a value equivalent to</p>"
            },
            {
              "block": "log2(x);",
              "context": "blockItem",
              "title": "<b>base-2 logarithmic function</b></br>\n<p>The log2() function returns the base 2 logarithm of `x`.</p>"
            },
            {
              "block": "logb(x);",
              "context": "blockItem",
              "title": "<b>get exponent of a floating-point value</b></br>\n<p>If `x` is subnormal, logb() returns the exponent `x` would have if it were normalized.</p>"
            },
            {
              "block": "lrint(x);",
              "context": "blockItem",
              "title": "<b>round to nearest integer</b></br>\n<p>\n \nThese functions round their argument to the nearest integer value, using the current rounding direction (see fesetround(3)).\n  \nNote that unlike rint(3), etc., the return type of these functions differs from that of their arguments.\n </p>"
            },
            {
              "block": "lround(x);",
              "context": "blockItem",
              "title": "<b>round to nearest integer, away from zero</b></br>\n<p>\n \nThese functions round their argument to the nearest integer value, rounding away from zero, regardless of the current rounding direction (see fenv(3)).\n  \nNote that unlike round(3), ceil(3), etc., the return type of these functions differs from that of their arguments.\n </p>"
            },
            {
              "block": "modf(x, iptr);",
              "context": "blockItem",
              "title": "<b>extract signed integral and fractional values from floating-point number</b></br>\n<p>The modf() function breaks the argument `x` into an integral part and a fractional part, each of which has the same sign as `x`. The integral part is stored in the location pointed to by `iptr`.</p>"
            },
            {
              "block": "nearbyint(x);",
              "context": "blockItem",
              "title": "<b>round to nearest integer</b></br>\n<p>The nearbyint() functions round their argument to an integer value in floating-point format, using the current rounding direction (see fesetround(3)) and without raising the _inexact_ exception.</p>"
            },
            {
              "block": "pow(x, y);",
              "context": "blockItem",
              "title": "<b>power functions</b></br>\n<p>The pow() function returns the value of `x` raised to the power of `y`.</p>"
            },
            {
              "block": "remainder(x, y);",
              "context": "blockItem",
              "title": "<b>floating-point remainder function</b></br>\n<p>The remainder() function computes the remainder of dividing `x` by `y`. The return value is `x`-_n_\\*`y`, where _n_ is the value _x / y_, rounded to the nearest integer. If the absolute value of `x`-_n_\\*`y` is 0.5, _n_ is chosen to be even.</p>"
            },
            {
              "block": "remquo(x, y, quo);",
              "context": "blockItem",
              "title": "<b>remainder and part of quotient</b></br>\n<p>For example, _remquo(29.0, 3.0)_ returns -1.0 and might store 2. Note that the actual quotient might not fit in an integer.</p>"
            },
            {
              "block": "rint(x);",
              "context": "blockItem",
              "title": "<b>round to nearest integer</b></br>\n<p>The rint() functions do the same, but will raise the _inexact_ exception (\\*FE_INEXACT\\*, checkable via fetestexcept(3)) when the result differs in value from the argument.</p>"
            },
            {
              "block": "scalbln(x, exp);",
              "context": "blockItem",
              "title": "<b>multiply floating-point number by integral power of radix</b></br>\n<p>\n \nThese functions multiply their first argument `x` by \\*FLT_RADIX\\* (probably 2) to the power of `exp`, that is:\n       x \\* FLT_RADIX \\*\\* exp    \nThe definition of \\*FLT_RADIX\\* can be obtained by including _<float.h>_.\n  </p>"
            },
            {
              "block": "scalbn(x, exp);",
              "context": "blockItem",
              "title": "<b>multiply floating-point number by integral power of radix</b></br>\n<p>\n \nThese functions multiply their first argument `x` by \\*FLT_RADIX\\* (probably 2) to the power of `exp`, that is:\n       x \\* FLT_RADIX \\*\\* exp    \nThe definition of \\*FLT_RADIX\\* can be obtained by including _<float.h>_.\n  </p>"
            },
            {
              "block": "signbit(x);",
              "context": "blockItem",
              "title": "<b>test sign of a real floating-point number</b></br>\n<p>signbit() is a generic macro which can work on all real floating-point types. It returns a nonzero value if the value of _x_ has its sign bit set.</p>"
            },
            {
              "block": "sin(x);",
              "context": "blockItem",
              "title": "<b>sine function</b></br>\n<p>The sin() function returns the sine of `x`, where `x` is given in radians.</p>"
            },
            {
              "block": "sinh(x);",
              "context": "blockItem",
              "title": "<b>hyperbolic sine function</b></br>\n<p>The sinh() function returns the hyperbolic sine of `x`, which is defined mathematically as:</p>"
            },
            {
              "block": "sqrt(x);",
              "context": "blockItem",
              "title": "<b>square root function</b></br>\n<p>The sqrt() function returns the nonnegative square root of `x`.</p>"
            },
            {
              "block": "tan(x);",
              "context": "blockItem",
              "title": "<b>tangent function</b></br>\n<p>The tan() function returns the tangent of `x`, where `x` is given in radians.</p>"
            },
            {
              "block": "tgamma(x);",
              "context": "blockItem",
              "title": "<b>true gamma function</b></br>\n<p>\n \nThe Gamma function is defined by\n  \n    Gamma(x) = integral from 0 to infinity of t^(x-1) e^-t dt\n  \nIt is defined for every real number except for nonpositive integers. For nonnegative integral _m_ one has\n  \n    Gamma(m+1) = m!\n  \nand, more generally, for all `x`:\n  \n    Gamma(x+1) = x \\* Gamma(x)\n  \nFurthermore, the following is valid for all values of `x` outside the poles:\n  \n    Gamma(x) \\* Gamma(1 - x) = PI / sin(PI \\* x)\n  </p>"
            },
            {
              "block": "trunc(x);",
              "context": "blockItem",
              "title": "<b>round to integer, toward zero</b></br>\n<p>\n \nThese functions round `x` to the nearest integer not larger in absolute value.\n </p>"
            }
          ]
        },
        {
          "name": "time.h",
          "color": "blue",
          "blocks": [
            {
              "block": "#include <time.h>",
              "context": "compilationUnit"
            },
            {
              "block": "asctime(tm);",
              "context": "blockItem",
              "title": "<b>transform date and time to broken-down time or ASCII</b></br>\n<p>The asctime() and mktime() functions both take an argument representing broken-down time which is a representation separated into year, month, day, and so on.</p>"
            },
            {
              "block": "clock();",
              "context": "blockItem",
              "title": "<b>determine processor time</b></br>\n<p>The clock() function returns an approximation of processor time used by the program.</p>"
            },
            {
              "block": "ctime(timep);",
              "context": "blockItem",
              "title": "<b>transform date and time to broken-down time or ASCII</b></br>\n<p>The ctime(), \\*gmtime\\*() and \\*localtime\\*() functions all take an argument of data type `time_t` which represents calendar time. When interpreted as an absolute time value, it represents the number of seconds elapsed since the Epoch, 1970-01-01 00:00:00 +0000 (UTC).</p>"
            },
            {
              "block": "difftime(time1, time0);",
              "context": "blockItem",
              "title": "<b>calculate time difference</b></br>\n<p>The difftime() function returns the number of seconds elapsed between time `time1` and time `time0`, represented as a _double_. Each of the times is specified in calendar time, which means its value is a measurement (in seconds) relative to the Epoch, 1970-01-01 00:00:00 +0000 (UTC).</p>"
            },
            {
              "block": "mktime(tm);",
              "context": "blockItem",
              "title": "<b>transform date and time to broken-down time or ASCII</b></br>\n<p>The mktime() function converts a broken-down time structure, expressed as local time, to calendar time representation. The function ignores the values supplied by the caller in the _tm_wday_ and _tm_yday_ fields. The value specified in the _tm_isdst_ field informs mktime() whether or not daylight saving time (DST) is in effect for the time supplied in the `tm` structure: a positive value means DST is in effect; zero means that DST is not in effect; and a negative value means that mktime() should (use timezone information and system databases to) attempt to determine whether DST is in effect at the specified time.</p>"
            },
            {
              "block": "strftime(s, max, format, tm);",
              "context": "blockItem",
              "title": "<b>format date and time</b></br>\n<p>The strftime() function formats the broken-down time `tm` according to the format specification `format` and places the result in the character array `s` of size `max`.</p>"
            },
            {
              "block": "time(tloc);",
              "context": "blockItem",
              "title": "<b>get time</b></br>\n<p>The time() function shall return the value of time  in seconds since the Epoch.</p>"
            }
          ]
        },
        {
          "name": "ctype.h",
          "color": "blue",
          "blocks": [
            {
              "block": "#include <ctype.h>",
              "context": "compilationUnit"
            },
            {
              "block": "toupper(c);",
              "context": "blockItem",
              "title": "<b>converts letter to uppercase</b></br>\n<p>\nConverts a lowercase letter to uppercase.\n\n</p>"
            },
            {
              "block": "tolower(c);",
              "context": "blockItem",
              "title": "<b>converts letter to lowercase</b></br>\n<p>\nConverts an uppercase letter to lowercase.\n\n</p>"
            },
            {
              "block": "isxdigit(c);",
              "context": "blockItem",
              "title": "<b>checks if character is hexadecimal</b></br>\n<p>\nChecks if the given character is a hexadecimal digit.\n\nHexadecimal digits are: `'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'`.\n\n</p>"
            },
            {
              "block": "isupper(c);",
              "context": "blockItem",
              "title": "<b>checks if character is uppercase</b></br>\n<p>\nChecks if the given character is an uppercase alphabetic letter.\n\n</p>"
            },
            {
              "block": "isspace(c);",
              "context": "blockItem",
              "title": "<b>checks if character is a white-space</b></br>\n<p>\nChecks if the given character is a white-space character. C considers white-space characters to be `' '`,`'\\n'`,`\\t`,`'\\v'`,`\\f`,`'\\r'`.\n\n</p>"
            },
            {
              "block": "ispunct(c);",
              "context": "blockItem",
              "title": "<b>checks if character is a punctuation mark</b></br>\n<p>\nChecks if the given character is a punctuation character. C considers every graphic character (see `isgraph()`) that is not alphanumeric to be a punctuation.\n\n</p>"
            },
            {
              "block": "isprint(c);",
              "context": "blockItem",
              "title": "<b>checks if character is printable</b></br>\n<p>\nChecks if the given character is a printable character. A printable character is a character that is displayed on the screen when printed. This is the opposite of a control character (see `iscntrl()`).\n\nAn example of a printable character is `'a'`. An example of a control character is `'\\n'`.\n\n</p>"
            },
            {
              "block": "islower(c);",
              "context": "blockItem",
              "title": "<b>checks if character is lowercase</b></br>\n<p>\nChecks if the given character is a lowercase alphabetic letter.\n\n</p>"
            },
            {
              "block": "isgraph(c);",
              "context": "blockItem",
              "title": "<b>checks if character is graphical</b></br>\n<p>\nChecks if the given character has a graphical representation. The characters with graphical representation are all those given by `isprint()` except the space character `' '`.\n\n</p>"
            },
            {
              "block": "isdigit(c);",
              "context": "blockItem",
              "title": "<b>checks if character is a digit</b></br>\n<p>\nChecks if the given character is a numeric digit. Note that, per the ASCII table, the character `'5'` and the integer `5` are different and only the first one constitutes a numeric digit. \n\n</p>"
            },
            {
              "block": "iscntrl(c);",
              "context": "blockItem",
              "title": "<b>checks if character is control</b></br>\n<p>\nChecks if the given character is a control character. A control character is a character that is not displayed on the screen when printed. This is the opposite of a printable character (see `isprint()`).\n\nAn example of a control character is `'\\n'`. An example of a printable character is `'a'`.\n\n</p>"
            },
            {
              "block": "isblank(c);",
              "context": "blockItem",
              "title": "<b>checks if character is blank</b></br>\n<p>\nChecks if the given character is blank, which means either a space `' '` or a tab `'\\t'`.\n\n</p>"
            },
            {
              "block": "isalpha(c);",
              "context": "blockItem",
              "title": "<b>checks if character is an alphabetic letter.</b></br>\n<p>\nChecks if the given character is an alphabetic letter.\n\n</p>"
            },
            {
              "block": "isalnum(c);",
              "context": "blockItem",
              "title": "<b>checks if character is alphanumeric</b></br>\n<p>\nChecks if the given character is alphanumeric.\n\n</p>"
            }
          ]
        },
        {
          "name": "stdarg.h",
          "color": "blue",
          "blocks": [
            {
              "block": "#include <stdarg.h>",
              "context": "compilationUnit"
            },
            {
              "block": "va_arg(ap, type);",
              "context": "blockItem",
              "title": "<b>variable argument lists</b></br>\n<p>The va_arg() macro expands to an expression that has the type and value of the next argument in the call. The argument `ap` is the _va_list_ `ap` initialized by va_start(). Each call to va_arg() modifies `ap` so that the next call returns the next argument. The argument `type` is a type name specified so that the type of a pointer to an object that has the specified type can be obtained simply by adding a \\* to `type`.</p>"
            },
            {
              "block": "va_copy(dest, src);",
              "context": "blockItem",
              "title": "<b>variable argument lists</b></br>\n<p>The va_copy() macro copies the (previously initialized) variable argument list `src` to `dest`. The behavior is as if va_start() were applied to `dest` with the same _last_ argument, followed by the same number of va_arg() invocations that was used to reach the current state of `src`.</p>"
            },
            {
              "block": "va_end(ap);",
              "context": "blockItem",
              "title": "<b>variable argument lists</b></br>\n<p>    va_list aq; va_copy(aq, ap); ... va_end(aq);    </p>"
            },
            {
              "block": "va_start(ap, last);",
              "context": "blockItem",
              "title": "<b>variable argument lists</b></br>\n<p>The va_start() macro initializes `ap` for subsequent use by va_arg() and va_end(), and must be called first.</p>"
            }
          ]
        }
      ],
      "modeOptions": {
        "functions": {
          "GetChar": {
            "color": "blue",
            "shape": "block-only"
          },
          "GetDouble": {
            "color": "blue",
            "shape": "block-only"
          },
          "GetFloat": {
            "color": "blue",
            "shape": "block-only"
          },
          "GetInt": {
            "color": "blue",
            "shape": "block-only"
          },
          "GetLongLong": {
            "color": "blue",
            "shape": "block-only"
          },
          "GetString": {
            "color": "blue",
            "shape": "block-only"
          },
          "clearerr": {
            "color": "blue",
            "shape": "block-only"
          },
          "fclose": {
            "color": "blue",
            "shape": "block-only"
          },
          "feof": {
            "color": "blue",
            "shape": "block-only"
          },
          "ferror": {
            "color": "blue",
            "shape": "block-only"
          },
          "fflush": {
            "color": "blue",
            "shape": "block-only"
          },
          "fgetc": {
            "color": "blue",
            "shape": "block-only"
          },
          "fgetpos": {
            "color": "blue",
            "shape": "block-only"
          },
          "fgets": {
            "color": "blue",
            "shape": "block-only"
          },
          "fopen": {
            "color": "blue",
            "shape": "block-only"
          },
          "fprintf": {
            "color": "blue",
            "shape": "block-only"
          },
          "fputc": {
            "color": "blue",
            "shape": "block-only"
          },
          "fputs": {
            "color": "blue",
            "shape": "block-only"
          },
          "fread": {
            "color": "blue",
            "shape": "block-only"
          },
          "fscanf": {
            "color": "blue",
            "shape": "block-only"
          },
          "fseek": {
            "color": "blue",
            "shape": "block-only"
          },
          "fsetpos": {
            "color": "blue",
            "shape": "block-only"
          },
          "ftell": {
            "color": "blue",
            "shape": "block-only"
          },
          "fwrite": {
            "color": "blue",
            "shape": "block-only"
          },
          "getc": {
            "color": "blue",
            "shape": "block-only"
          },
          "getchar": {
            "color": "blue",
            "shape": "block-only"
          },
          "gets": {
            "color": "blue",
            "shape": "block-only"
          },
          "perror": {
            "color": "blue",
            "shape": "block-only"
          },
          "printf": {
            "color": "blue",
            "shape": "block-only",
            "minArgs": 1
          },
          "putc": {
            "color": "blue",
            "shape": "block-only"
          },
          "putchar": {
            "color": "blue",
            "shape": "block-only"
          },
          "puts": {
            "color": "blue",
            "shape": "block-only"
          },
          "remove": {
            "color": "blue",
            "shape": "block-only"
          },
          "rewind": {
            "color": "blue",
            "shape": "block-only"
          },
          "scanf": {
            "color": "blue",
            "shape": "block-only",
            "minArgs": 1
          },
          "setbuf": {
            "color": "blue",
            "shape": "block-only"
          },
          "setvbuf": {
            "color": "blue",
            "shape": "block-only"
          },
          "snprintf": {
            "color": "blue",
            "shape": "block-only",
            "minArgs": 3
          },
          "sprintf": {
            "color": "blue",
            "shape": "block-only"
          },
          "sscanf": {
            "color": "blue",
            "shape": "block-only",
            "minArgs": 2
          },
          "ungetc": {
            "color": "blue",
            "shape": "block-only"
          },
          "vfprintf": {
            "color": "blue",
            "shape": "block-only"
          },
          "vfscanf": {
            "color": "blue",
            "shape": "block-only"
          },
          "vprintf": {
            "color": "blue",
            "shape": "block-only"
          },
          "vscanf": {
            "color": "blue",
            "shape": "block-only"
          },
          "vsnprintf": {
            "color": "blue",
            "shape": "block-only"
          },
          "vsprintf": {
            "color": "blue",
            "shape": "block-only"
          },
          "vsscanf": {
            "color": "blue",
            "shape": "block-only"
          },
          "abort": {
            "color": "blue",
            "shape": "block-only"
          },
          "abs": {
            "color": "blue",
            "shape": "block-only"
          },
          "atexit": {
            "color": "blue",
            "shape": "block-only"
          },
          "atof": {
            "color": "blue",
            "shape": "block-only"
          },
          "atoi": {
            "color": "blue",
            "shape": "block-only"
          },
          "atol": {
            "color": "blue",
            "shape": "block-only"
          },
          "atoll": {
            "color": "blue",
            "shape": "block-only"
          },
          "bsearch": {
            "color": "blue",
            "shape": "block-only"
          },
          "calloc": {
            "color": "blue",
            "shape": "block-only"
          },
          "div": {
            "color": "blue",
            "shape": "block-only"
          },
          "drand48": {
            "color": "blue",
            "shape": "block-only"
          },
          "exit": {
            "color": "blue",
            "shape": "block-only"
          },
          "free": {
            "color": "blue",
            "shape": "block-only"
          },
          "getenv": {
            "color": "blue",
            "shape": "block-only"
          },
          "labs": {
            "color": "blue",
            "shape": "block-only"
          },
          "ldiv": {
            "color": "blue",
            "shape": "block-only"
          },
          "llabs": {
            "color": "blue",
            "shape": "block-only"
          },
          "lldiv": {
            "color": "blue",
            "shape": "block-only"
          },
          "malloc": {
            "color": "blue",
            "shape": "block-only"
          },
          "mblen": {
            "color": "blue",
            "shape": "block-only"
          },
          "mbstowcs": {
            "color": "blue",
            "shape": "block-only"
          },
          "mbtowc": {
            "color": "blue",
            "shape": "block-only"
          },
          "qsort": {
            "color": "blue",
            "shape": "block-only"
          },
          "rand": {
            "color": "blue",
            "shape": "block-only"
          },
          "realloc": {
            "color": "blue",
            "shape": "block-only"
          },
          "srand": {
            "color": "blue",
            "shape": "block-only"
          },
          "srand48": {
            "color": "blue",
            "shape": "block-only"
          },
          "strtod": {
            "color": "blue",
            "shape": "block-only"
          },
          "strtof": {
            "color": "blue",
            "shape": "block-only"
          },
          "strtol": {
            "color": "blue",
            "shape": "block-only"
          },
          "strtold": {
            "color": "blue",
            "shape": "block-only"
          },
          "strtoll": {
            "color": "blue",
            "shape": "block-only"
          },
          "strtoul": {
            "color": "blue",
            "shape": "block-only"
          },
          "strtoull": {
            "color": "blue",
            "shape": "block-only"
          },
          "system": {
            "color": "blue",
            "shape": "block-only"
          },
          "wcstombs": {
            "color": "blue",
            "shape": "block-only"
          },
          "wctomb": {
            "color": "blue",
            "shape": "block-only"
          },
          "memchr": {
            "color": "blue",
            "shape": "block-only"
          },
          "memcmp": {
            "color": "blue",
            "shape": "block-only"
          },
          "memcpy": {
            "color": "blue",
            "shape": "block-only"
          },
          "memmove": {
            "color": "blue",
            "shape": "block-only"
          },
          "memset": {
            "color": "blue",
            "shape": "block-only"
          },
          "strcat": {
            "color": "blue",
            "shape": "block-only"
          },
          "strchr": {
            "color": "blue",
            "shape": "block-only"
          },
          "strcmp": {
            "color": "blue",
            "shape": "block-only"
          },
          "strcoll": {
            "color": "blue",
            "shape": "block-only"
          },
          "strcpy": {
            "color": "blue",
            "shape": "block-only"
          },
          "strcspn": {
            "color": "blue",
            "shape": "block-only"
          },
          "strerror": {
            "color": "blue",
            "shape": "block-only"
          },
          "strlen": {
            "color": "blue",
            "shape": "block-only"
          },
          "strncat": {
            "color": "blue",
            "shape": "block-only"
          },
          "strncmp": {
            "color": "blue",
            "shape": "block-only"
          },
          "strncpy": {
            "color": "blue",
            "shape": "block-only"
          },
          "strpbrk": {
            "color": "blue",
            "shape": "block-only"
          },
          "strrchr": {
            "color": "blue",
            "shape": "block-only"
          },
          "strspn": {
            "color": "blue",
            "shape": "block-only"
          },
          "strstr": {
            "color": "blue",
            "shape": "block-only"
          },
          "strtok": {
            "color": "blue",
            "shape": "block-only"
          },
          "strxfrm": {
            "color": "blue",
            "shape": "block-only"
          },
          "acos": {
            "color": "blue",
            "shape": "block-only"
          },
          "acosh": {
            "color": "blue",
            "shape": "block-only"
          },
          "asin": {
            "color": "blue",
            "shape": "block-only"
          },
          "asinh": {
            "color": "blue",
            "shape": "block-only"
          },
          "atan": {
            "color": "blue",
            "shape": "block-only"
          },
          "atan2": {
            "color": "blue",
            "shape": "block-only"
          },
          "atanh": {
            "color": "blue",
            "shape": "block-only"
          },
          "ceil": {
            "color": "blue",
            "shape": "block-only"
          },
          "copysign": {
            "color": "blue",
            "shape": "block-only"
          },
          "cos": {
            "color": "blue",
            "shape": "block-only"
          },
          "cosh": {
            "color": "blue",
            "shape": "block-only"
          },
          "erf": {
            "color": "blue",
            "shape": "block-only"
          },
          "erfc": {
            "color": "blue",
            "shape": "block-only"
          },
          "exp": {
            "color": "blue",
            "shape": "block-only"
          },
          "exp2": {
            "color": "blue",
            "shape": "block-only"
          },
          "expm1": {
            "color": "blue",
            "shape": "block-only"
          },
          "fabs": {
            "color": "blue",
            "shape": "block-only"
          },
          "fdim": {
            "color": "blue",
            "shape": "block-only"
          },
          "floor": {
            "color": "blue",
            "shape": "block-only"
          },
          "fma": {
            "color": "blue",
            "shape": "block-only"
          },
          "fmax": {
            "color": "blue",
            "shape": "block-only"
          },
          "fmin": {
            "color": "blue",
            "shape": "block-only"
          },
          "fmod": {
            "color": "blue",
            "shape": "block-only"
          },
          "fpclassify": {
            "color": "blue",
            "shape": "block-only"
          },
          "frexp": {
            "color": "blue",
            "shape": "block-only"
          },
          "ilogb": {
            "color": "blue",
            "shape": "block-only"
          },
          "isfinite": {
            "color": "blue",
            "shape": "block-only"
          },
          "isgreater": {
            "color": "blue",
            "shape": "block-only"
          },
          "isgreaterequal": {
            "color": "blue",
            "shape": "block-only"
          },
          "isinf": {
            "color": "blue",
            "shape": "block-only"
          },
          "isless": {
            "color": "blue",
            "shape": "block-only"
          },
          "islessequal": {
            "color": "blue",
            "shape": "block-only"
          },
          "islessgreater": {
            "color": "blue",
            "shape": "block-only"
          },
          "isnan": {
            "color": "blue",
            "shape": "block-only"
          },
          "isnormal": {
            "color": "blue",
            "shape": "block-only"
          },
          "isunordered": {
            "color": "blue",
            "shape": "block-only"
          },
          "ldexp": {
            "color": "blue",
            "shape": "block-only"
          },
          "llrint": {
            "color": "blue",
            "shape": "block-only"
          },
          "llround": {
            "color": "blue",
            "shape": "block-only"
          },
          "log": {
            "color": "blue",
            "shape": "block-only"
          },
          "log10": {
            "color": "blue",
            "shape": "block-only"
          },
          "log1p": {
            "color": "blue",
            "shape": "block-only"
          },
          "log2": {
            "color": "blue",
            "shape": "block-only"
          },
          "logb": {
            "color": "blue",
            "shape": "block-only"
          },
          "lrint": {
            "color": "blue",
            "shape": "block-only"
          },
          "lround": {
            "color": "blue",
            "shape": "block-only"
          },
          "modf": {
            "color": "blue",
            "shape": "block-only"
          },
          "nearbyint": {
            "color": "blue",
            "shape": "block-only"
          },
          "pow": {
            "color": "blue",
            "shape": "block-only"
          },
          "remainder": {
            "color": "blue",
            "shape": "block-only"
          },
          "remquo": {
            "color": "blue",
            "shape": "block-only"
          },
          "rint": {
            "color": "blue",
            "shape": "block-only"
          },
          "round": {
            "color": "blue",
            "shape": "block-only"
          },
          "scalbln": {
            "color": "blue",
            "shape": "block-only"
          },
          "scalbn": {
            "color": "blue",
            "shape": "block-only"
          },
          "signbit": {
            "color": "blue",
            "shape": "block-only"
          },
          "sin": {
            "color": "blue",
            "shape": "block-only"
          },
          "sinh": {
            "color": "blue",
            "shape": "block-only"
          },
          "sqrt": {
            "color": "blue",
            "shape": "block-only"
          },
          "tan": {
            "color": "blue",
            "shape": "block-only"
          },
          "tgamma": {
            "color": "blue",
            "shape": "block-only"
          },
          "trunc": {
            "color": "blue",
            "shape": "block-only"
          },
          "asctime": {
            "color": "blue",
            "shape": "block-only"
          },
          "clock": {
            "color": "blue",
            "shape": "block-only"
          },
          "ctime": {
            "color": "blue",
            "shape": "block-only"
          },
          "difftime": {
            "color": "blue",
            "shape": "block-only"
          },
          "mktime": {
            "color": "blue",
            "shape": "block-only"
          },
          "strftime": {
            "color": "blue",
            "shape": "block-only"
          },
          "time": {
            "color": "blue",
            "shape": "block-only"
          },
          "isalnum": {
            "color": "blue",
            "shape": "block-only"
          },
          "isalpha": {
            "color": "blue",
            "shape": "block-only"
          },
          "isblank": {
            "color": "blue",
            "shape": "block-only"
          },
          "iscntrl": {
            "color": "blue",
            "shape": "block-only"
          },
          "isdigit": {
            "color": "blue",
            "shape": "block-only"
          },
          "isgraph": {
            "color": "blue",
            "shape": "block-only"
          },
          "islower": {
            "color": "blue",
            "shape": "block-only"
          },
          "isprint": {
            "color": "blue",
            "shape": "block-only"
          },
          "ispunct": {
            "color": "blue",
            "shape": "block-only"
          },
          "isspace": {
            "color": "blue",
            "shape": "block-only"
          },
          "isupper": {
            "color": "blue",
            "shape": "block-only"
          },
          "isxdigit": {
            "color": "blue",
            "shape": "block-only"
          },
          "tolower": {
            "color": "blue",
            "shape": "block-only"
          },
          "toupper": {
            "color": "blue",
            "shape": "block-only"
          },
          "va_arg": {
            "color": "blue",
            "shape": "block-only"
          },
          "va_copy": {
            "color": "blue",
            "shape": "block-only"
          },
          "va_end": {
            "color": "blue",
            "shape": "block-only"
          },
          "va_start": {
            "color": "blue",
            "shape": "block-only"
          }
        }
      }
    },
    'ace/mode/coffee': {
      mode: 'coffeescript',
      textModeAtStart: true,
      palette: [
        {
          'name': 'Output',
          'color': 'blue',
          blocks: [
          {'block': 'console.log "hello"'}
          ]
        },
        {
          'name': 'Variables',
          'color': 'blue',
          'blocks': [
          {'block': 'a = 10'},
          {'block': 'a += 10'},
          {'block': 'a -= 10'},
          {'block': 'a *= 10'},
          {'block': 'a /= 10'},
          ]
        },
        {
          'name': 'Functions',
          'color': 'purple',
          'blocks': [
          {'block': 'myFunction = (param) ->\n  ``'},
          {'block': 'myFunction(arg)'},
          {'block': 'return result'}
          ]
        },
        {
          'name': 'Logic',
          'color': 'teal',
          'blocks': [
          {'block': 'a is b'},
          {'block': 'a isnt b'},
          {'block': 'a > b'},
          {'block': 'a < b'},
          {'block': 'a || b'},
          {'block': 'a && b'},
          {'block': '!a'}
          ]
        },
        {
          'name': 'Operators',
          'color': 'green',
          'blocks': [
          {'block': 'a + b'},
          {'block': 'a - b'},
          {'block': 'a * b'},
          {'block': 'a / b'},
          {'block': 'a % b'},
          {'block': 'Math.pow(a, b)'},
          {'block': 'Math.sin(a)'},
          {'block': 'Math.tan(a)'},
          {'block': 'Math.cos(a)'},
          {'block': 'Math.random()'}
          ]
        },
        {
          'name': 'Control flow',
          'color': 'orange',
          'blocks': [
          {'block': 'for i in [1..10]\n  ``'},
          {'block': 'for el, i in list\n  ``'},
          {'block': 'if a is b\n  ``'},
          {'block': 'if a is b\n  ``\nelse\n  ``'},
          {'block': 'while true\n  ``'},
          {'block': 'myFunction = (param) ->\n  ``'}
          ]
        },
      ]
    },
    'ace/mode/javascript': {
      mode: 'javascript',
      textModeAtStart: true,
      palette: [
      {
        'name': 'Output',
        'color': 'blue',
        'blocks': [
        {'block': 'console.log("hello");'},
        ]
      },
      {
        'name': 'Variables',
        'color': 'blue',
        'blocks': [
        {'block': 'var a = 10;'},
        {'block': 'a = 10;'},
        {'block': 'a += 10;'},
        {'block': 'a -= 10;'},
        {'block': 'a *= 10;'},
        {'block': 'a /= 10;'}
        ]
      },
      {
        'name': 'Functions',
        'color': 'purple',
        'blocks': [
        {'block': 'function myFunction(param) {\n  __\n}'},
        {'block': 'myFunction(arg);'},
        {'block': 'return result'}
        ]
      },
      {
        'name': 'Logic',
        'color': 'teal',
        'blocks': [
        {'block': 'a === b'},
        {'block': 'a !== b'},
        {'block': 'a > b'},
        {'block': 'a < b'},
        {'block': 'a || b'},
        {'block': 'a && b'},
        {'block': '!a'}
        ]
      },
      {
        'name': 'Operators',
        'color': 'green',
        'blocks': [
        {'block': 'a + b'},
        {'block': 'a - b'},
        {'block': 'a * b'},
        {'block': 'a / b'},
        {'block': 'a % b'},
        {'block': 'Math.pow(a, b)'},
        {'block': 'Math.sin(a)'},
        {'block': 'Math.tan(a)'},
        {'block': 'Math.cos(a)'},
        {'block': 'Math.random()'}
        ]
      },
      {
        'name': 'Control flow',
        'color': 'orange',
        'blocks': [
        {'block': 'for (var i = 0; i < 10; i++) {\n  __\n}'},
        {'block': 'if (a === b) {\n  __\n}'},
        {'block': 'if (a === b) {\n  __\n} else {\n  __\n}'},
        {'block': 'while (true) {\n  __\n}'},
        {'block': 'function myFunction(param) {\n  __\n}'}
        ]
      },
      ]
    }
  };

  main.consumes = ["Plugin", "Editor", "editors", "tabManager", "ace", "ui", "commands", "menus"];
  main.provides = ["droplet"];
  return main;

  function main(options, imports, register) {
    var Plugin = imports.Plugin;
    var tabManager = imports.tabManager;
    var ace = imports.ace;
    var ui = imports.ui;
    var commands = imports.commands;
    var menus = imports.menus;

    /***** Initialization *****/

    var plugin = new Plugin("Ajax.org", main.consumes);
    var emit = plugin.getEmitter();

    ui.insertCss(require("text!./droplet/css/droplet.css"), plugin);

    window._lastEditor = null;

    menus.addItemByPath('View/Toggle Blocks', {
      command: "droplet_toggle"
    }, 0, plugin);

    function load() {
      tabManager.once("ready", function() {
        tabManager.getTabs().forEach(function(tab) {
          var ace = tab.path && tab.editor.ace;
          if (ace && tab.editorType == "ace") {
            attachToAce(tab.editor.ace);
          }
        });
        ace.on("create", function(e) {
          e.editor.on("createAce", attachToAce, plugin);
        }, plugin);
      });
    }

    function unload() {
      tabManager.getTabs().forEach(function(tab) {
        var ace = tab.path && tab.editor.ace;
        if (ace) {
          detachFromAce(tab.editor.ace);
        }
      });
      dropletEditor = null;
    }

    /***** Methods *****/

    function applyGetValueHack(aceSession, dropletEditor) {

      /*
      // Get the current session for the droplet editor
      var dropletSession = dropletEditor.session;

      // Find the tab we want
      tabManager.getTabs().forEach(function(tab) {
        var ace = tab.path && tab.editor.ace;
        var doc = tab.document, c9Session = tab.document.getSession();

        if (ace && ace.getSession() == aceSession && tab.editorType == 'ace') {
          // Replace value retrieval
          doc.on("getValue", function get(e) {
            if (dropletSession.currentlyUsingBlocks) {
              console.log("Getting value from Droplet.");
              return dropletSession.tree.stringify();
            }
            else {
              console.log("Could have gotten value from Droplet, but getting from text mode instead.");
              var session = c9Session.session;
              return session
                  ? session.doc.getValue(session.doc.$fsNewLine)
                  : e.value;
            }
          }, c9Session);

          // Fire changed when changed occurs
          dropletEditor.on('change', function() {
            if (dropletEditor.session === dropletSession) { //TODO: currentlyActive property from Droplet core
              console.log('Emitting changed event from Droplet.')
              doc.undoManager._emit('change');
            }
          });
        }
      });

      /*dropletEditor.on('change', function() {
        if (dropletEditor.session === session) {
          aceSession.doc.changed = true;
        }
      });*/
    }

    function attachToAce(aceEditor) {
      if (!aceEditor._dropletEditor) {
        var currentValue = aceEditor.getValue();
        var dropletEditor = aceEditor._dropletEditor = new droplet.Editor(aceEditor, lookupOptions(aceEditor.getSession().$modeId), worker);

        if (dropletEditor.session != null) {
         applyGetValueHack(aceEditor.getSession(), aceEditor._dropletEditor);
        }

        // Restore the former top margin (for looking contiguous with the tab)
        dropletEditor.wrapperElement.style.top = '7px';

        dropletEditor.on('change', function() {
          setTimeout(function() {
            console.log('Setting ace value');
            dropletEditor.setAceValue(dropletEditor.getValue());
          }, 0);
        })

        _lastEditor = dropletEditor; // for debugging
        aceEditor._dropletEditor.setValue(currentValue);

        var button = document.createElement('div');
        button.className = 'c9-droplet-toggle-button';
        button.innerText = '';
        button.style.position = 'absolute';
        button.style.right = '-30px';
        button.style.width = '30px';
        button.style.height = '50px';
        button.style.top = '50%';
        button.style.bottom='50%';
        button.style.marginTop = '-25px';
        button.style.cursor = 'pointer';
        button.style.boxShadow = '6px 0 6px -6px gray';
        button.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        button.style.borderTopRightRadius = button.style.borderBottomRightRadius = '5px';
        dropletEditor.paletteElement.appendChild(button);

        button.addEventListener('click', function() {
          aceEditor._dropletEditor.toggleBlocks();
        });

        // here we get an instance of ace
        // we can listen for setSession
        // and create droplet editor attached to this ace instance
        // it can work similar to http://pencilcode.net/edit/first
        // where there is a widget on the gutter displayed for all coffee files
        aceEditor.on("changeSession", function(e) {
          if (aceEditor._dropletEditor.hasSessionFor(e.session)) {
            button.style.display = 'block';
          }
          else {
            var option = lookupOptions(e.session.$modeId);
            if (option != null) {
              aceEditor._dropletEditor.bindNewSession(option);
              applyGetValueHack(aceEditor.getSession(), aceEditor._dropletEditor);
              button.style.display = 'block';
            }
            else {
              button.style.display = 'none';
            }
          }
          window.lastBoundSession = e.session;
          e.session.on('changeMode', function(e) {
          if (aceEditor._dropletEditor.hasSessionFor(aceEditor.getSession())) {
           aceEditor._dropletEditor.setMode(lookupMode(aceEditor.getSession().$modeId), lookupModeOptions(aceEditor.getSession().$modeId));
           aceEditor._dropletEditor.setPalette(lookupPalette(aceEditor.getSession().$modeId));
         }
        else {
          var option = lookupOptions(aceEditor.getSession().$modeId);
          if (option != null) {
           aceEditor._dropletEditor.bindNewSession(option);
           applyGetValueHack(aceEditor.getSession(), aceEditor._dropletEditor);
           button.style.display = 'block';
         }
          else {
           button.style.display = 'none';
          }
        }
        })
        });

        // Bind to mode changes
        aceEditor.getSession().on('changeMode', function(e) {
          if (aceEditor._dropletEditor.hasSessionFor(aceEditor.getSession())) {
      aceEditor._dropletEditor.setMode(lookupMode(aceEditor.getSession().$modeId), lookupModeOptions(aceEditor.getSession().$modeId));
      aceEditor._dropletEditor.setPalette(lookupPalette(aceEditor.getSession().$modeId));
   }
    else {
      var option = lookupOptions(aceEditor.getSession().$modeId);
      if (option != null) {
        aceEditor._dropletEditor.bindNewSession(option);
        button.style.display = 'block';
     }
      else {
        button.style.display = 'none';
      }
    }
        })

        // Bind to the associated resize event
        tabManager.getTabs().forEach(function(tab) {
          var ace = tab.path && tab.editor.ace;
          if (ace == aceEditor && tab.editorType == 'ace') {
            tab.editor.on('resize', function() {
              dropletEditor.resize();
            });
          }
        });
      }

      function lookupOptions(mode) {
        if (mode in OPT_MAP) {
          return OPT_MAP[mode];
        }
        else {
          return null;
        }
      }

      function lookupMode(id) {
        return (OPT_MAP[id] || {mode: null}).mode;
      }
      function lookupModeOptions(id) {
        return (OPT_MAP[id] || {mode: null}).modeOptions;
      }
      function lookupPalette(id) {
        return (OPT_MAP[id] || {palette: null}).palette;
      }

    }

    function detachFromAce(ace) {

    }

    plugin.on("resize", function() {
      alert('hello');
    })

    /***** Lifecycle *****/

    plugin.on("load", function() {
      load();
    });
    plugin.on("unload", function() {
      unload();
    });

    /***** Register and define API *****/

    plugin.freezePublicAPI({

    });

    register(null, {
      "droplet": plugin
    });
  }
});
