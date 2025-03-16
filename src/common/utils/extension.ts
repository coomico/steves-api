// Object mapping MIME types to their corresponding file extensions
export const MIMETYPE_TO_EXTENSIONS = {
  // Banner image types
  'image/apng': ['apng'],
  'image/avif': ['avif'],
  'image/gif': ['gif'],
  'image/jpeg': ['jpg', 'jpeg', 'jpe', 'jif', 'jfif', 'jfi'],
  'image/png': ['png'],
  'image/webp': ['webp'],

  // Additional image types
  'image/vnd.microsoft.icon': ['ico'],
  'image/svg+xml': ['svg', 'svgz'],
  'image/tiff': ['tif', 'tiff'],
  'image/vnd.dvb.subtitle': ['sub'],

  // Audio types
  'audio/aac': ['aac'],
  'audio/aptx': ['aptx'],
  'audio/basic': ['au', 'snd'],
  'audio/flac': ['flac'],
  'audio/midi': ['mid', 'midi'],
  'audio/midi-clip': ['midi-clip'],
  'audio/x-midi': ['mid', 'midi'],
  'audio/x-aac': ['aac'],
  'audio/x-aiff': ['aif', 'aiff', 'aifc'],
  'audio/x-wav': ['wav'],
  'audio/mpeg': ['mp3', 'mpga', 'mp2', 'mp2a', 'm2a', 'm3a'],
  'audio/mp4': ['m4a', 'mp4a'],
  'audio/ogg': ['oga', 'ogg', 'spx', 'opus'],
  'audio/opus': ['opus'],
  'audio/vnd.wav': ['wav'],
  'audio/wav': ['wav'],
  'audio/wave': ['wav'],
  'audio/webm': ['weba'],
  'audio/3gpp': ['3gp', '3gpp'],
  'audio/3gpp2': ['3g2', '3gp2'],
  'audio/matroska': ['mka'],

  // Video types
  'video/AV1': ['av1'],
  'video/3gpp': ['3gp', '3gpp'],
  'video/3gpp2': ['3g2', '3gp2'],
  'video/x-msvideo': ['avi'],
  'video/mp4': ['mp4', 'mp4v', 'mpg4', 'm4v'],
  'video/mpeg': ['mpeg', 'mpg', 'mpe', 'm1v', 'm2v'],
  'video/jpeg': ['jpgv'],
  'video/jpm': ['jpm', 'jpgm'],
  'video/ogg': ['ogv'],
  'video/mp2t': ['ts'],
  'video/mj2': ['mj2', 'mjp2'],
  'video/matroska': ['mkv'],
  'video/matroska-3d': ['mk3d'],
  'video/webm': ['webm'],
  'video/h261': ['h261'],
  'video/h263': ['h263'],
  'video/h264': ['h264'],
  'video/h265': ['h265'],
  'video/h266': ['h266'],
  'video/vnd.vivo': ['viv'],
  'video/quicktime': ['qt', 'mov'],
  'video/x-ms-asf': ['asf', 'asx'],
  'video/x-ms-wm': ['wm'],
  'video/x-m4v': ['m4v'],
  'video/x-f4v': ['f4v'],
  'video/x-fli': ['fli'],
  'video/x-flv': ['flv'],
  'video/x-sgi-movie': ['movie'],

  // Text types
  'text/html': ['html', 'htm', 'shtml'],
  'text/plain': ['txt', 'text', 'conf', 'def', 'list', 'log', 'in', 'ini'],
  'text/richtext': ['rtx'],
  'text/calendar': ['ics', 'ifb', 'ical'],
  'text/css': ['css'],
  'text/csv': ['csv'],
  'text/csv-schema': ['csvs'],
  'text/javascript': ['js', 'mjs'],
  'text/markdown': ['md', 'markdown'],
  'text/mathml': ['mml'],
  'text/tab-separated-values': ['tsv'],
  'text/troff': ['t', 'tr', 'roff', 'man', 'me', 'ms'],
  'text/vnd.curl': ['curl'],
  'text/xml': ['xml'],
  'text/uri-list': ['uri', 'uris', 'urls'],
  'text/yaml': ['yaml', 'yml'],

  // Application types
  'application/rtf': ['rtf'],
  'application/x-abiword': ['abw'],
  'application/x-freearc': ['arc'],
  'application/octet-stream': [
    'bin',
    'dms',
    'lrf',
    'mar',
    'so',
    'dist',
    'distz',
    'pkg',
    'bpk',
    'dump',
    'elc',
    'deploy',
    'exe',
    'dll',
    'deb',
    'dmg',
    'iso',
    'img',
    'msi',
    'msp',
    'msm',
  ],
  'application/x-cdf': ['cdf'],

  // Microsoft Word formats
  'application/msword': ['doc', 'dot'],
  'application/vnd.ms-word.document.macroenabled.12': ['docm'],
  'application/vnd.ms-word.template.macroenabled.12': ['dotm'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    'docx',
  ],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.template': [
    'dotx',
  ],

  // Microsoft PowerPoint formats
  'application/vnd.ms-powerpoint': ['ppt', 'pot', 'pps', 'ppa'],
  'application/vnd.ms-powerpoint.slide.macroenabled.12': ['sldm'],
  'application/vnd.ms-powerpoint.presentation.macroenabled.12': ['pptm'],
  'application/vnd.ms-powerpoint.slideshow.macroenabled.12': ['ppsm'],
  'application/vnd.ms-powerpoint.template.macroenabled.12': ['potm'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': [
    'pptx',
  ],
  'application/vnd.openxmlformats-officedocument.presentationml.slide': [
    'sldx',
  ],
  'application/vnd.openxmlformats-officedocument.presentationml.slideshow': [
    'ppsx',
  ],

  // Microsoft Excel formats
  'application/vnd.ms-excel': ['xls', 'xlt', 'xla'],
  'application/vnd.ms-excel.template.macroenabled.12': ['xltm'],
  'application/vnd.ms-excel.sheet.macroenabled.12': ['xlsm'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.template': [
    'xltx',
  ],

  // Other Microsoft formats
  'application/onenote': ['one', 'onetoc2', 'onetmp', 'onepkg'],

  // Adobe formats
  'application/pdf': ['pdf'],
  'application/vnd.adobe.xfdf': ['xfdf'],

  // Other document formats
  'application/vnd.visio': ['vsd', 'vst', 'vss', 'vsw'],
  'application/vnd.ms-fontobject': ['eot'],
  'application/epub+zip': ['epub'],
  'application/vnd.amazon.ebook': ['azw'],

  // Archive formats
  'application/zip': ['zip'],
  'application/x-zip-compressed': ['zip'],
  'application/gzip': ['gz', 'gzip'],
  'application/x-gzip': ['gz', 'gzip'],
  'application/java-archive': ['jar', 'war', 'ear'],
  'application/x-bzip': ['bz'],
  'application/x-bzip2': ['bz2', 'boz'],
  'application/vnd.rar': ['rar'],
  'application/x-rar-compressed': ['rar'],
  'application/x-tar': ['tar'],
  'application/x-7z-compressed': ['7z'],
  'application/vnd.airzip.filesecure.azf': ['azf'],
  'application/vnd.airzip.filesecure.azs': ['azs'],

  // Data formats
  'application/json': ['json'],
  'application/ld+json': ['jsonld'],
  'application/javascript': ['js', 'mjs'],
  'application/xml': ['xml', 'xsl', 'xsd', 'rng'],

  // Executable formats
  'application/x-msdownload': ['exe', 'dll', 'com', 'bat', 'msi'],
  'application/vnd.apple.installer+xml': ['mpkg'],

  // OpenDocument formats
  'application/vnd.oasis.opendocument.presentation': ['odp'],
  'application/vnd.oasis.opendocument.spreadsheet': ['ods'],
  'application/vnd.oasis.opendocument.text': ['odt'],

  // Media container formats
  'application/ogg': ['ogx'],
  'application/mp4': ['mp4'],

  // Web formats
  'application/xhtml+xml': ['xhtml', 'xht'],
  'application/x-httpd-php': ['php'],
  'application/x-sh': ['sh'],

  // Font formats
  'font/collection': ['ttc'],
  'font/otf': ['otf'],
  'font/sfnt': ['sfnt'],
  'font/ttf': ['ttf'],
  'font/woff': ['woff'],
  'font/woff2': ['woff2'],
};
