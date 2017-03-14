/**
 *  [].slice.call 可以转换类数组为数组，但是旧版本IE下的HTMLCollection、NodeList不是Object的
 * 子类，会导致执行异常
 */

