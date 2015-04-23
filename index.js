// Generated by CoffeeScript 1.9.1
(function() {
  "use strict";
  var CypherQuery, INVALID_IDEN, QUERY_PARTS, RESERVED, extend,
    slice = [].slice,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  extend = function(target, source) {
    var k, v;
    for (k in source) {
      v = source[k];
      target[k] = v;
    }
    return target;
  };

  RESERVED = ['start', 'create', 'set', 'delete', 'foreach', 'match', 'optionalMatch', 'where', 'with', 'return', 'skip', 'limit', 'order', 'by', 'asc', 'desc', 'on', 'when', 'case', 'then', 'else', 'drop', 'using', 'merge', 'constraint', 'assert', 'scan', 'remove', 'union'];

  INVALID_IDEN = /\W/;

  QUERY_PARTS = ['start', 'match', 'optionalMatch', 'where', 'create', 'merge', 'with', 'set', 'delete', 'forach', 'return', 'union', 'union all', 'order by', 'limit', 'skip'];

  CypherQuery = (function() {
    var escape, escape_identifier, i, k, len, part_builder;

    function CypherQuery(opt) {
      var key, val;
      if (typeof this === "undefined" || this === null) {
        return new CypherQuery(opt);
      }
      this._params = {};
      this._query = {};
      if (opt != null) {
        for (key in opt) {
          val = opt[key];
          this[key].apply(this, [].concat(val));
        }
      }
    }

    CypherQuery.prototype.toString = function() {
      var joiner, key, val;
      return ((function() {
        var i, len, results;
        results = [];
        for (i = 0, len = QUERY_PARTS.length; i < len; i++) {
          key = QUERY_PARTS[i];
          if (!((val = this._query[key]) != null)) {
            continue;
          }
          joiner = (function() {
            switch (key) {
              case 'where':
                return ' AND ';
              case 'merge':
                return ' MERGE ';
              case 'optionalMatch':
                return ' OPTIONAL MATCH ';
              case 'create':
                return ' CREATE ';
              default:
                return ', ';
            }
          })();
          switch (key) {
            case 'merge':
            case 'create':
              results.push(key.toLowerCase() + ' ' + val.join(joiner).replace(/\{(\w+)\}/g, (function(_this) {
                return function(_, key) {
                  var _val;
                  _val = escape(JSON.stringify(_this._params[key]).replace(/"/g, "'") || (function() {
                    throw new Error("Missing: " + key);
                  })());
                  return _val.slice(1, +(_val.length - 2) + 1 || 9e9).replace(/'([\w_]+)':/g, function(_, key) {
                    return "`" + key + "`:";
                  });
                };
              })(this)));
              break;
            case 'order by':
              results.push('ORDER BY ' + val.join(joiner).replace(/\{(\w+)\}/g, (function(_this) {
                return function(_, key) {
                  return escape(_this._params[key].slice(1, _this.params[key].length - 1));
                };
              })(this)));
              break;
            case 'optionalMatch':
              results.push('OPTIONAL MATCH ' + val.join(joiner));
              break;
            default:
              results.push(key.toUpperCase() + ' ' + val.join(joiner));
          }
        }
        return results;
      }).call(this)).join("\n");
    };

    CypherQuery.prototype.execute = function(db, cb) {
      return db.query(this.toString(), this._params, cb);
    };

    CypherQuery.prototype.compile = function(with_params) {
      if (!with_params) {
        return this.toString();
      } else {
        return this.toString().replace(/\{(\w+)\}/g, (function(_this) {
          return function(_, key) {
            return escape(_this._params[key] || (function() {
              throw new Error("Missing: " + key);
            })());
          };
        })(this));
      }
    };

    CypherQuery.prototype.params = function(params, val) {
      if (val != null) {
        this._params[params] = val;
        return this;
      } else if (params != null) {
        extend(this._params, params);
        return this;
      } else {
        return this._params;
      }
    };

    part_builder = function(key) {
      return function() {
        var ref, vals;
        vals = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        if (!vals.length) {
          return this._query[key];
        }
        if (typeof vals[vals.length - 1] !== 'string') {
          this.params(vals.pop());
        }
        if (this._query[key] == null) {
          this._query[key] = vals;
        } else {
          (ref = this._query[key]).push.apply(ref, vals);
        }
        return this;
      };
    };

    for (i = 0, len = QUERY_PARTS.length; i < len; i++) {
      k = QUERY_PARTS[i];
      CypherQuery.prototype[k] = part_builder(k);
    }

    CypherQuery.prototype.ret = CypherQuery.prototype["return"];

    CypherQuery.prototype.index = function(index, expr, params) {
      return this.start("n=" + index + "(" + expr + ")", params);
    };

    CypherQuery.prototype.autoindex = function(expr, params) {
      return this.index('node:node_auto_index', expr, params);
    };

    CypherQuery.install = function(target) {
      if (target == null) {
        target = require('neo4j/lib/GraphDatabase');
      }
      return target.prototype.builder = function(opt) {
        var query;
        query = new CypherQuery(opt);
        query.execute = query.execute.bind(query, this);
        return query;
      };
    };

    CypherQuery.escape = escape = function(val) {
      switch (typeof val) {
        case 'boolean':
          return val != null ? val : {
            'true': 'false'
          };
        case 'number':
          return val;
        default:
          return '"' + (('' + val).replace(/"/g, '""')) + '"';
      }
    };

    CypherQuery.escape_identifier = escape_identifier = function(name) {
      var ref;
      if ((ref = name.toLowerCase(), indexOf.call(RESERVED, ref) >= 0) || INVALID_IDEN.test(name)) {
        return '`' + (name.replace('`', '``')) + '`';
      } else {
        return name;
      }
    };

    CypherQuery.pattern = (function(patterns, length_re) {
      return function(arg) {
        var alias, direction, length, optional, rel_str, type;
        type = arg.type, direction = arg.direction, alias = arg.alias, optional = arg.optional, length = arg.length;
        rel_str = (type != null) || (alias != null) || optional ? '[' + (alias != null ? escape_identifier(alias) : '') + (optional ? '?' : '') + (type != null ? ':' + escape_identifier(type) : '') + ((length != null) && (length_re.test(length)) ? '*' + length : '') + ']' : '';
        return (patterns[direction || 'all'] || (function() {
          throw new Error('Invalid direction');
        })()).replace('%s', rel_str);
      };
    })({
      out: '-%s->',
      "in": '<-%s-',
      all: '-%s-'
    }, /^(?:\d+)?(?:\.\.)?(?:\d+)?$/);

    return CypherQuery;

  })();

  module.exports = CypherQuery;

}).call(this);
