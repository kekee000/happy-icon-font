import prefix from 'loglevel-plugin-prefix';
import log from 'loglevel';

const logger = (name: string) => {
    let logger = log.noConflict();
    const prefixer = (prefix as any).noConflict();
    prefix.reg(logger);

    switch (process.env.NODE_ENV) {
        case 'development': {
            log.setLevel('debug');
            break;
        }
        case 'test': {
            log.enableAll();
            break;
        }
        case 'production': {
            log.disableAll();
            break;
        }
    }

    logger = log.getLogger(name);
    prefixer.apply(logger, {
        template: '[%t] %l %n:',
        /**
         * 格式化日志级别，将小写转换为大写
         *
         * @param {string} level 日志级别，可以是 'debug'、'info'、'warn'、'error' 中的一种
         * @returns {string} 返回大写的日志级别字符串
         */
        levelFormatter(level) {
            return level.toUpperCase();
        },
        /**
         * 格式化节点名称，如果没有名称则返回'root'
         * @param {string} name 节点名称，可选参数，默认为空字符串
         * @returns {string} 返回格式化后的节点名称，如果没有名称则返回'root'
         */
        nameFormatter(name) {
            return name || 'root';
        },
        /**
         * @function timestampFormatter
         * @description 将日期转换为时间字符串，格式为小时:分钟:秒数
         * @param {Date} date 需要转换的日期对象
         * @returns {string} 返回一个字符串，格式为小时:分钟:秒数
         */
        timestampFormatter(date) {
            return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
        },
        format: undefined,
    });

    return logger as log.Logger;
};

export default logger;
