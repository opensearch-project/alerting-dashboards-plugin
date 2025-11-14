// ===== Commands (from lexer & parser) =====
export const COMMANDS = [
  'SEARCH','DESCRIBE','SHOW','FROM','WHERE','FIELDS','RENAME','STATS','DEDUP',
  'SORT','EVAL','HEAD','TOP','RARE','PARSE','METHOD','REGEX','PUNCT','GROK',
  'PATTERN','PATTERNS','NEW_FIELD','KMEANS','AD','ML',
];

// ===== Assist / clause keywords =====
export const CLAUSE = ['AS','BY','SOURCE','INDEX','DESC','DATASOURCES','SORTBY'];

// ===== Logical / boolean keywords =====
export const LOGICAL = ['AND','OR','NOT','XOR','TRUE','FALSE','REGEXP','IN'];

// ===== Operators & symbols =====
export const OPERATORS = [
  '=', '!=', '<>', '<', '<=', '>', '>=', '+', '-', '*', '/', '%', '!',
  '|', '&', '^', '~', '.', ',', ':', '(', ')', '[', ']', '\'','"', '`'
];

// ===== Field classification helpers =====
export const FIELD_KEYWORDS = ['AUTO','STR','IP','NUM'];

// ===== Converted data types =====
export const CONVERTED_TYPES = [
  'INT','INTEGER','DOUBLE','LONG','FLOAT','STRING','BOOLEAN','DATE','TIME','TIMESTAMP'
];

// ===== Date/time/interval units =====
export const SIMPLE_DATE_UNITS = [
  'MICROSECOND','SECOND','MINUTE','HOUR','DAY','WEEK','MONTH','QUARTER','YEAR'
];
export const COMPLEX_DATE_UNITS = [
  'SECOND_MICROSECOND','MINUTE_MICROSECOND','MINUTE_SECOND','HOUR_MICROSECOND',
  'HOUR_SECOND','HOUR_MINUTE','DAY_MICROSECOND','DAY_SECOND','DAY_MINUTE',
  'DAY_HOUR','YEAR_MONTH'
];
export const INTERVAL_UNITS = [...SIMPLE_DATE_UNITS, ...COMPLEX_DATE_UNITS];

export const SPAN_UNITS = [
  'MS','S','M','H','D','W','Q','Y','MILLISECOND','SECOND','MINUTE','HOUR','DAY','WEEK','MONTH','QUARTER','YEAR'
];

// ===== Aggregations (complete from grammar) =====
export const AGGS = [
  'AVG','COUNT','DISTINCT_COUNT','ESTDC','ESTDC_ERROR','MAX','MEAN','MEDIAN','MIN','MODE','RANGE',
  'STDEV','STDEVP','SUM','SUMSQ','VAR_SAMP','VAR_POP','STDDEV_SAMP','STDDEV_POP',
  'PERCENTILE','TAKE','FIRST','LAST','LIST','VALUES','EARLIEST','EARLIEST_TIME',
  'LATEST','LATEST_TIME','PER_DAY','PER_HOUR','PER_MINUTE','PER_SECOND','RATE','SPARKLINE','C','DC'
];

// ===== Mathematical & trig functions =====
export const MATH_FUNCS = [
  'ABS','CBRT','CEIL','CEILING','CONV','CRC32','E','EXP','FLOOR','LN','LOG','LOG10','LOG2','MOD','PI',
  'POW','POWER','RAND','ROUND','SIGN','SQRT','TRUNCATE',
  'ACOS','ASIN','ATAN','ATAN2','COS','COT','DEGREES','RADIANS','SIN','TAN'
];

// ===== Date/time functions (complete from grammar) =====
export const DATE_FUNCS = [
  'ADDDATE','ADDTIME','CONVERT_TZ','CURDATE','CURRENT_DATE','CURRENT_TIME','CURRENT_TIMESTAMP','CURTIME',
  'DATE','DATEDIFF','DATE_ADD','DATE_FORMAT','DATE_SUB','DAY','DAYNAME','DAYOFMONTH','DAYOFWEEK','DAYOFYEAR',
  'DAY_OF_MONTH','DAY_OF_WEEK','DAY_OF_YEAR','FROM_DAYS','FROM_UNIXTIME','GET_FORMAT','HOUR','HOUR_OF_DAY',
  'LAST_DAY','LOCALTIME','LOCALTIMESTAMP','MAKEDATE','MAKETIME','MICROSECOND','MINUTE','MINUTE_OF_DAY',
  'MINUTE_OF_HOUR','MONTH','MONTHNAME','MONTH_OF_YEAR','NOW','PERIOD_ADD','PERIOD_DIFF','QUARTER','SECOND',
  'SECOND_OF_MINUTE','SEC_TO_TIME','STR_TO_DATE','SUBDATE','SUBTIME','SYSDATE','TIME','TIMEDIFF','TIMESTAMP',
  'TIMESTAMPADD','TIMESTAMPDIFF','TIME_FORMAT','TIME_TO_SEC','TO_DAYS','TO_SECONDS','UNIX_TIMESTAMP',
  'UTC_DATE','UTC_TIME','UTC_TIMESTAMP','WEEK','WEEKDAY','WEEK_OF_YEAR','YEAR','YEARWEEK','DATETIME'
];

// ===== Text & other functions =====
export const TEXT_FUNCS = [
  'SUBSTR','SUBSTRING','LTRIM','RTRIM','TRIM','LOWER','UPPER','CONCAT','CONCAT_WS','LENGTH','STRCMP','RIGHT',
  'LEFT','ASCII','LOCATE','REPLACE','REVERSE','CAST','POSITION','EXTRACT','GET_FORMAT','TYPEOF'
];

// ===== Boolean-returning functions (condition base) =====
export const BOOL_FUNCS = ['LIKE','ISNULL','ISNOTNULL','IF','NULLIF','IFNULL'];

// ===== Relevance functions & args =====
export const RELEVANCE_FUNCS = [
  'MATCH','MATCH_PHRASE','MATCH_PHRASE_PREFIX','MATCH_BOOL_PREFIX',
  'SIMPLE_QUERY_STRING','MULTI_MATCH','QUERY_STRING'
];

export const RELEVANCE_ARGS = [
  'ALLOW_LEADING_WILDCARD','ANALYZER','ANALYZE_WILDCARD','AUTO_GENERATE_SYNONYMS_PHRASE_QUERY',
  'BOOST','CUTOFF_FREQUENCY','DEFAULT_FIELD','DEFAULT_OPERATOR','ENABLE_POSITION_INCREMENTS','ESCAPE',
  'FIELDS','FLAGS','FUZZINESS','FUZZY_MAX_EXPANSIONS','FUZZY_PREFIX_LENGTH','FUZZY_REWRITE',
  'FUZZY_TRANSPOSITIONS','LENIENT','LOW_FREQ_OPERATOR','MAX_DETERMINIZED_STATES','MAX_EXPANSIONS',
  'MINIMUM_SHOULD_MATCH','OPERATOR','PHRASE_SLOP','PREFIX_LENGTH','QUOTE_ANALYZER','QUOTE_FIELD_SUFFIX',
  'REWRITE','SLOP','TIE_BREAKER','TIME_ZONE','TYPE','ZERO_TERMS_QUERY'
];

// ===== Datasets & types =====
export const DATASET_TYPES = ['DATAMODEL','LOOKUP','SAVEDSEARCH'];

// ===== KMEANS / AD / ML args =====
export const KMEANS_ARGS = ['CENTROIDS','ITERATIONS','DISTANCE_TYPE'];
export const AD_ARGS = [
  'NUMBER_OF_TREES','SHINGLE_SIZE','SAMPLE_SIZE','OUTPUT_AFTER','TIME_DECAY','ANOMALY_RATE',
  'CATEGORY_FIELD','TIME_FIELD','DATE_FORMAT','TIME_ZONE','TRAINING_DATA_SIZE','ANOMALY_SCORE_THRESHOLD'
];
export const ML_ARGS_PLACEHOLDER = ['param=value']; // parser allows generic (ident = literalValue)

// ===== Command arguments / modifiers =====
export const CMD_ARGS_MISC = [
  'KEEPEMPTY','CONSECUTIVE','DEDUP_SPLITVALUES','PARTITIONS','ALLNUM','DELIM','NEW_FIELD','PATTERN','PATTERNS','METHOD','PUNCT','REGEX'
];

// ===== Defaults / common fields =====
export const DEFAULT_FIELDS = ['_source','_score','@timestamp','@message','host.name','log.file.path'];
