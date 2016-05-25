$.fn.extend({
    validate: function (p) {
        /**
         * 对象
         * @type {*|jQuery|HTMLElement}
         */
        var Form = $(this);
        //验证失败的对象
        Form.failure = [];
        //正在运行的异步验证数量
        Form.ajaxNum = 0;
        /**
         * 绑定提交事件
         */
        Form.on('submit', function (event) {
            /**
             * 第一次触发Submit事件时记录
             */
            if (!Form.firstSubmit) {
                Form.find('input,textarea,select').trigger('change');
                Form.firstSubmit = true;
            }
            /**
             * 有验证失败的表单或有异步验证在执行时不提交
             */
            if (Form.failure.length || Form.ajaxNum != 0) {
                event.preventDefault();
            }
        });
        /**
         * 验证程序
         * @type {{}}
         */
        var Action = {
            /**
             * 必须输入
             * @param obj 表单对象
             * @param param 验证参数
             * @param success 成功信息
             * @param error 错误信息
             */
            required: function (obj, name, value, param, success, error) {
                return value != '';
            },
            email: function (obj, name, value, param, success, error) {
                return /^([a-zA-Z0-9_\-\.])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$/i.test(value)
            },
            http: function (obj, name, value, param, success, error) {
                return /^(http[s]?:)?(\/{2})?([a-z0-9]+\.)?[a-z0-9]+(\.(com|cn|cc|org|net|com.cn))$/i.test(value);
            },
            phone: function (obj, name, value, param, success, error) {
                return /^\d{11}$/.test(value);
            },
            qq: function (obj, name, value, param, success, error) {
                return /^\d{5,10}$/.test(value);
            },
            tel: function (obj, name, value, param, success, error) {
                return /(?:\(\d{3,4}\)|\d{3,4}-?)\d{8}/.test(value);
            },
            identity: function (obj, name, value, param, success, error) {
                return /^(\d{15}|\d{18})$/.test(value);
            },
            china: function (obj, name, value, param, success, error) {
                return /^([^u4e00-u9fa5]|\w)+$/i.test(value);
            },
            maxlen: function (obj, name, value, param, success, error) {
                return value.length <= param;
            },
            minlen: function (obj, name, value, param, success, error) {
                return value.length >= param;
            },
            num: function (obj, name, value, param, success, error) {
                opt = param.split(/\s*,\s*/);
                return value >= opt[0] * 1 && value <= opt[1] * 1;
            },
            regexp: function (obj, name, value, param, success, error) {
                return param.test(value);
            },
            confirm: function (obj, name, value, param, success, error) {
                //比较的表单如确认密码
                var confirmObj = $("[name='" + param + "']");
                //当比对的表单事件发生时，触发主表单
                confirmObj.change(function () {
                    obj.trigger('change');
                })
                return value == confirmObj.val();
            },
            ajax: function (obj, name, value, param, success, error) {
                /**
                 * 更改Ajax验证数
                 * @type {number}
                 */
                Form.ajaxNum += 1;
                /**
                 * POST提交的数据
                 */
                var postData = param.data ? param.data : {};
                postData[name] = value;
                /**
                 * 发送验证
                 */
                $.ajax({
                    url: param.url,
                    data: postData,
                    type: 'POST',
                    dataType: 'JSON',
                    success: function (JSON) {
                        /**
                         * 移除Ajax验证的记数
                         * @type {number}
                         */
                        Form.ajaxNum -= 1;
                        /**
                         * 验证状态
                         * @type {boolean}
                         */
                        var status = JSON.status ? true : false;
                        /**
                         * 设置提示信息
                         */
                        init.setSpanMessage(status, obj, name, JSON.message, JSON.message);
                        /**
                         * 处理验证结果
                         * a) status:true 记录错误表单
                         * b) status:false 移除原来记录的错误表单
                         */
                        init.recordVerificationResult(status, name);
                    },
                    error: function () {
                        /**
                         * 服务器错误如403、404
                         */
                        init.setSpanMessage(false, obj, name, success, error);
                        init.recordVerificationResult(false, name);
                    }
                })
                /**
                 * Ajax验证中。。。。
                 */
                return 'run';
            }
        }
        /**
         * 初始化处理类
         * @type {{__init: Function, bindHander: Function}}
         */
        var init = {
            /**
             * 构造函数
             * @private
             */
            __construct: function () {
                //绑定事件
                this.bindHandler();
            },
            /**
             * 绑定事件
             */
            bindHandler: function () {
                for (var FieldName in p) {
                    /**
                     * 获得表单对象
                     */
                    var FieldObj = this.getFieldObj(FieldName);
                    //对象不存在时不处理
                    if (!FieldObj)continue;
                    //设置Span默认提示信息
                    this.setSpanDefaultMessage(FieldObj, FieldName);
                    //绑定事件
                    this.bindExeAction(FieldObj, FieldName);
                }
            },
            /**
             * 绑定执行方法
             * @param FieldObj 表单对象
             * @param FieldName 字段name名
             */
            bindExeAction: function (FieldObj, FieldName) {
                /**
                 * 获得事件名称如change
                 * @type {string}
                 */
                var EventName = this.getEventName(FieldObj);
                /**
                 * 绑定验证方法
                 * @param EventName 事件名称
                 * @param FieldObj 表单对象
                 * @param Rule 验证规则
                 */
                Form.find(FieldObj).on(EventName, {obj: FieldObj, name: FieldName}, function (event) {
                    /**
                     * 表单对象
                     */
                    var FieldObj = event.data.obj;
                    /**
                     * 表单名称
                     */
                    var FieldName = event.data.name;
                    /**
                     * 验证规则
                     * @type {*|rule|.username.rule}
                     */
                    var rule = p[FieldName].rule;
                    /**
                     * 表单值
                     */
                    var value = init.getFieldValue(FieldObj);
                    /**
                     * 必须验证字段或内容不为空时才验证
                     */
                    if (rule['required'] || value) {
                        /**
                         * 执行验证动作
                         */
                        for (var r in rule) {
                            /**
                             * 正确提示信息
                             * @type {success|.username.success|.ajax.success|x.success}
                             */
                            var successMessage = p[FieldName].success;
                            /**
                             * 错误提示信息
                             * @type {.username.error|*|Error|MediaError|cD.error|error}
                             */
                            var errorMessage = p[FieldName].error ? p[FieldName].error[r] : null;
                            /**
                             * 执行验证程序
                             * 表单对象，值，验证规则参数如require:true即true，成功信息，错误信息
                             */
                            var status = Action[r](FieldObj, FieldName, value, rule[r], successMessage, errorMessage);
                            /**
                             * 设置提示信息
                             */
                            init.setSpanMessage(status, FieldObj, FieldName, successMessage, errorMessage);
                            /**
                             * 记录验证失败的表单
                             * status true:验证通过   false:验证失败  run:Ajax验证中
                             */
                            init.recordVerificationResult(status, FieldName);
                            /**
                             * 验证失败时不进行后面规则的验证
                             */
                            if (status == false) {
                                break;
                            }
                        }
                    } else {
                        /**
                         * 非必须验证字段并且内容为空时清除span对象
                         */
                        init.hideSpanObj(FieldObj, FieldName);
                    }
                });
            },
            /**
             * 记录验证结果
             * @param status false 失败 true 成功 run 正在验证
             * @param FieldName 表单name属性
             */
            recordVerificationResult: function (status, FieldName) {
                if (status == 'run') {
                    /**
                     * Ajax验证中不进行错误表单的记录
                     */
                } else if (status) {
                    /**
                     * 验证成功
                     * 移除验证失败的表单
                     * @param FieldObj
                     */
                    Form.failure = $.grep(Form.failure, function (n, i) {
                        return n != FieldName;
                    });
                } else {
                    /**
                     * 验证失败
                     * 记录失败的表单
                     */
                    Form.failure = $.grep(Form.failure, function (n, i) {
                        return n != FieldName;
                    });
                    Form.failure.push(FieldName);
                }
            },
            /**
             * 获得表单的Value值
             * @param FieldObj
             */
            getFieldValue: function (FieldObj) {
                var type = FieldObj.attr('type');
                var value = '';
                if (type == 'radio' || type == 'checkbox') {
                    value = FieldObj.filter('[checked]').val();
                } else {
                    value = FieldObj.val();
                }
                return value != undefined || $.trim(value) != '' ? value : '';
            },
            /**
             * 获得事件名称
             * @param name
             * @returns {string}
             */
            getEventName: function (FieldObj) {
                return 'change';
            },
            /**
             * 获得表单对象
             * @param name
             */
            getFieldObj: function (name) {
                var obj = $("[name='" + name + "']");
                return obj.length == 0 ? false : obj;
            },
            /**
             * 设置Span默认提示信息
             * @param FieldName
             */
            setSpanDefaultMessage: function (FieldObj, FieldName) {
                if (p[FieldName].message) {
                    var spanObj = init.addSpanObj(FieldObj, FieldName);
                    spanObj.removeClass().addClass('hd-validate-notice').html(p[FieldName].message);
                }
            },
            /**
             * 设置提示信息
             * @param status false 失败 true 成功 run 正在验证
             * @param FieldObj 表单对象
             * @param FieldName 表单name属性
             * @param successMessage 成功信息
             * @param errorMessage 错误信息
             */
            setSpanMessage: function (status, FieldObj, FieldName, successMessage, errorMessage) {
                /**
                 * 移除Span对象
                 */
                init.hideSpanObj(FieldObj, FieldName);
                /**
                 * 设置提示信息
                 */
                if (status === 'run') {
                    //Ajax验证中...
                    //init.addSpanObj(FieldObj, FieldName).removeClass().addClass('hd-validate-success').html('Ajax...');
                } else if (status) {
                    /**
                     * 普通验证通过
                     */
                    if (successMessage)
                        init.addSpanObj(FieldObj, FieldName).removeClass().addClass('hd-validate-success').html(successMessage);
                } else {
                    /**
                     * 普通验证失败
                     */
                    if (errorMessage)
                        init.addSpanObj(FieldObj, FieldName).removeClass().addClass('hd-validate-error').html(errorMessage);
                }

            },
            /**
             * 移除Span对象
             * @param FieldName
             */
            hideSpanObj: function (FieldObj, FieldName) {
                return $('#hd_' + FieldName).css('display', 'none');
            },
            /**
             * 添加验证span标签
             * @param FieldObj 表单对象
             * @param FieldName 表单Name名
             */
            addSpanObj: function (FieldObj, FieldName) {
                //表单name名
                var spanId = "#hd_" + FieldName;
                /**
                 * 添加Span对象
                 */
                if ($(spanId).length == 0) {
                    var span = "<span id='hd_" + FieldName + "'></span>";
                    FieldObj.last().after(span);
                }
                return $(spanId).css('display', 'inline-block');
            }
        }
        /**
         * 初始化
         */
        init.__construct();
    }
});
