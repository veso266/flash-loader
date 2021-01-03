(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@awayfl/swf-loader'), require('@awayjs/view'), require('@awayfl/playerglobal'), require('@awayfl/avm1'), require('@awayfl/avm2')) :
    typeof define === 'function' && define.amd ? define(['exports', '@awayfl/swf-loader', '@awayjs/view', '@awayfl/playerglobal', '@awayfl/avm1', '@awayfl/avm2'], factory) :
    (factory((global.AwayflPlayer = {}),global.AwayflSwfLoader,global.AwayjsView,global.AwayflPlayerglobal,global.AwayflAvm1,global.AwayflAvm2));
}(this, (function (exports,swfLoader,view,playerglobal,avm1,avm2) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    function fullSerializer(obj) {
        var clone = Object.assign({}, obj);
        Object.keys(clone).forEach(function (key) {
            if (typeof clone[key] === 'object') {
                clone[key] = fullSerializer(clone[key]);
            }
            else if (typeof clone[key] === 'function') {
                // replace func with it string representation
                clone[key] = clone[key].toString();
            }
        });
        return clone;
    }
    var OBJECT_FIELDS = ['id', 'visible', 'index', 'assetType:type', 'name'];
    var AVMDebug = /** @class */ (function () {
        function AVMDebug(player) {
            this.player = player;
            swfLoader.registerDebugMethod(this._dirObjectByIds.bind(this), {
                name: "dirObjectByIds",
                description: "Export selected object to console",
                declaration: [{ name: 'ids', type: "object" }]
            });
            swfLoader.registerDebugMethod(this._applyPropsByIds.bind(this), {
                name: "applyPropsByIds",
                description: "Apply propertyes by node ids",
                declaration: [{ name: 'ids', type: "object" }, { name: 'object', type: 'object' }]
            });
            swfLoader.registerDebugMethod(this._removeObjectByIds.bind(this), {
                name: "removeObjectByIds",
                description: "Remove object from sceen tree",
                declaration: [{ name: 'ids', type: "object" }]
            });
            swfLoader.registerDebugMethod(this._getInfo.bind(this), {
                name: "getInfo",
                description: "Get file info for app",
                declaration: [{ name: "return", type: "object" }]
            });
            swfLoader.registerDebugMethod(this._getSceneTree.bind(this), {
                name: "getNodeTree",
                description: "Get sceen tree of app",
                declaration: [
                    { name: "return", type: "object" },
                    { name: "flat", type: "boolean" },
                    { name: "from", type: "number" },
                    { name: "rect", type: "object" }
                ]
            });
            swfLoader.registerDebugMethod(this._getStageCanvas.bind(this), {
                name: "getStageCanvas",
                description: "Get canvas attahed to stage",
                declaration: []
            });
            //@ts-ignore
            window._AWAY_DEBUG_PLAYER_ = this;
        }
        AVMDebug.prototype.onAvmInit = function (version) {
            //@ts-ignore
            window._AWAY_DEBUG_STORAGE = version === 1 ? avm1.SharedObjectDebug : playerglobal.SharedObjectDebug;
        };
        AVMDebug.prototype._selectNode = function (ids) {
            var node = this.player.root;
            var _loop_1 = function (i) {
                node = node._children.find(function (e) { return e.id === i; });
                if (!node) {
                    return "break";
                }
            };
            for (var _i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
                var i = ids_1[_i];
                var state_1 = _loop_1(i);
                if (state_1 === "break")
                    break;
            }
            if (!node) {
                throw new Error("Node not found");
            }
            return node;
        };
        AVMDebug.prototype._getStageCanvas = function () {
            return this.player.view.stage.container;
        };
        AVMDebug.prototype._dirObjectByIds = function (ids) {
            console.dir(this._selectNode(ids));
        };
        AVMDebug.prototype._getNodeBounds = function (node) {
            var view$$1 = this.player.view;
            var stage = view$$1.stage;
            var box = view.PickGroup.getInstance(view$$1).getBoundsPicker(node.partition).getBoxBounds(this.player.root);
            if (!box)
                return null;
            var sx = view$$1.width / this.player.stageWidth;
            var sy = view$$1.height / this.player.stageHeight;
            //console.log("DisplayObject:getRect not yet implemented");FromBounds
            return {
                x: box.x * sx,
                y: box.y * sy,
                width: box.width * sx,
                height: box.height * sy
            };
        };
        AVMDebug.prototype._traverse = function (node, req, rect, visibleOnly) {
            if (req === void 0) { req = false; }
            if (rect === void 0) { rect = false; }
            if (visibleOnly === void 0) { visibleOnly = false; }
            var ret = {
                parentId: node.parent ? node.parent.id : -1,
                children: null,
                rect: null,
            };
            for (var _i = 0, OBJECT_FIELDS_1 = OBJECT_FIELDS; _i < OBJECT_FIELDS_1.length; _i++) {
                var name_1 = OBJECT_FIELDS_1[_i];
                var sub = name_1.split(":");
                if (sub.length > 1) {
                    ret[sub[1]] = node[sub[0]];
                }
                else {
                    ret[name_1] = node[name_1];
                }
            }
            ret["globalVisible"] =
                node.parent ? (node.parent.visible && node.visible) : node.visible;
            if (rect) {
                ret.rect = this._getNodeBounds(node);
            }
            if (req) {
                ret.children = [];
                for (var _a = 0, _b = node._children; _a < _b.length; _a++) {
                    var c = _b[_a];
                    if (visibleOnly && c.visible || !visibleOnly) {
                        ret.children.push(this._traverse(c, req, rect, visibleOnly));
                    }
                }
            }
            return ret;
        };
        AVMDebug.prototype._removeObjectByIds = function (ids) {
            var node = this._selectNode(ids);
            node.parent.removeChild(node);
        };
        AVMDebug.prototype._applyPropsByIds = function (ids, object) {
            var node = this._selectNode(ids);
            Object.assign(node, object);
        };
        AVMDebug.prototype._getSceneTree = function (params, fromArg, rectArg) {
            if (typeof params !== 'object') {
                params = {
                    flat: params || false,
                    from: fromArg || 0,
                    rect: rectArg || false,
                    visibleOnly: false
                };
            }
            var _a = params.flat, flat = _a === void 0 ? false : _a, _b = params.from, _c = params.rect, rect = _c === void 0 ? false : _c, _d = params.visibleOnly, visibleOnly = _d === void 0 ? false : _d;
            var tree = [];
            var q = this.player.root._children.slice();
            while (true) {
                var node = q.pop();
                if (!node) {
                    break;
                }
                tree.push(this._traverse(node, !flat, rect, visibleOnly));
                if (flat) {
                    q.push.apply(q, node._children.reverse().filter(function (e) { return (e.visible && visibleOnly || !visibleOnly); }));
                }
            }
            return tree;
        };
        AVMDebug.prototype._getInfo = function () {
            var _a;
            var player = this.player;
            var avm = player._avmHandler.avmVersion;
            var _b = player._swfFile, swfVersion = _b.swfVersion, fpVersion = _b.fpVersion, frameCount = _b.frameCount, frameRate = _b.frameRate, compression = _b.compression, bytesTotal = _b.bytesTotal;
            var path = (_a = player._gameConfig.binary.filter(function (_a) {
                var resourceType = _a.resourceType;
                return resourceType === 'GAME';
            })[0]) === null || _a === void 0 ? void 0 : _a.path;
            if (path && path.indexOf('?') > -1) {
                path = path.substring(0, path.indexOf('?'));
            }
            return {
                file: {
                    name: player._gameConfig.title,
                    path: path,
                    size: bytesTotal
                },
                runtime: {
                    swfVersion: swfVersion,
                    fpVersion: fpVersion,
                    frameCount: frameCount,
                    frameRate: frameRate,
                    compression: compression,
                    avm: avm
                },
                config: fullSerializer(player._gameConfig)
            };
        };
        return AVMDebug;
    }());

    var AVMPlayer = /** @class */ (function (_super) {
        __extends(AVMPlayer, _super);
        function AVMPlayer(gameConfig) {
            var _this = _super.call(this, gameConfig) || this;
            _this.registerAVMStageHandler(new avm1.AVM1Handler());
            _this.registerAVMStageHandler(new avm2.AVM2Handler(new playerglobal.PlayerGlobal()));
            _this.addEventListener(swfLoader.AVMEvent.AVM_COMPLETE, function (event) { return _this.onAVMAvailable(event); });
            // export player api
            //if(!release) {
            _this._debug = new AVMDebug(_this);
            return _this;
            //}
        }
        AVMPlayer.prototype.onAVMAvailable = function (event) {
            if (this._debug) {
                this._debug.onAvmInit(event.avmVersion === "AVM1" /* AVM1 */ ? 1 : 2);
            }
        };
        return AVMPlayer;
    }(swfLoader.AVMStage));

    var AVM1Player = /** @class */ (function (_super) {
        __extends(AVM1Player, _super);
        function AVM1Player(gameConfig) {
            var _this = _super.call(this, gameConfig) || this;
            _this.registerAVMStageHandler(new avm1.AVM1Handler());
            return _this;
        }
        return AVM1Player;
    }(swfLoader.AVMStage));

    var AVM2Player = /** @class */ (function (_super) {
        __extends(AVM2Player, _super);
        function AVM2Player(gameConfig) {
            var _this = _super.call(this, gameConfig) || this;
            _this.registerAVMStageHandler(new avm2.AVM2Handler(new playerglobal.PlayerGlobal()));
            return _this;
        }
        return AVM2Player;
    }(swfLoader.AVMStage));

    console.debug("AwayFL - AwayFL-Player - 0.2.20");

    exports.AVMPlayer = AVMPlayer;
    exports.AVM1Player = AVM1Player;
    exports.AVM2Player = AVM2Player;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=awayfl-player.umd.js.map
