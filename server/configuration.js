const path = require("path");
const app_root = path.dirname(__dirname); // Parent of the directory where this file is

module.exports = {
    /** Port on which the application will listen */
    PORT: parseInt(process.env['PORT']) || 8080,

    /** Use HTTPS */
    HTTPS: process.env['HTTPS'] || false,

    PRIVATE_KEY_PATH:  "../../../../ssl/private.key",

    CERTIFICATE_PATH: "../../../../ssl/certificate.crt",

    CA_BUNDLE_PATH: "../../../../ssl/ca_bundle.crt",

     /** Save board data */
     SAVE_BOARDS: process.env['SAVE_BOARDS'] || false,

     /** Use a template to validate board data */
     ENFORCE_BOARD_TEMPLATE: process.env['ENFORCE_BOARD_TEMPLATE'] || false,

    /** Path to the directory where boards will be saved by default */
    HISTORY_DIR: process.env['WBO_HISTORY_DIR'] || path.join(app_root, "server-data"),

    /** Folder from which static files will be served */
    WEBROOT: process.env['WEBROOT'] || path.join(app_root, "client-data"),

    /** Number of milliseconds of inactivity after which the board should be saved to a file */
    SAVE_INTERVAL: parseInt(process.env['SAVE_INTERVAL']) || 1000 * 2, // Save after 2 seconds of inactivity

    /** Periodicity at which the board should be saved when it is being actively used (milliseconds)  */
    MAX_SAVE_DELAY: parseInt(process.env['MAX_SAVE_DELAY']) || 1000 * 60, // Save after 60 seconds even if there is still activity

    /** Maximal number of items to keep in the board. When there are more items, the oldest ones are deleted */
    MAX_ITEM_COUNT: parseInt(process.env['MAX_ITEM_COUNT']) || 32768,

    /** Max number of sub-items in an item. This prevents flooding */
    MAX_CHILDREN: parseInt(process.env['MAX_CHILDREN']) || 12800,

    /** Max number of items for batch processing of messages*/
    BATCH_SIZE: parseInt(process.env['BATCH_SIZE']) || 1024,

    /** Maximum value for any x or y on the board */
    MAX_BOARD_SIZE: parseInt(process.env['MAX_BOARD_SIZE']) || 65536,

    /** Maximum number of undos */
    MAX_UNDO_HISTORY: parseInt(process.env['MAX_UNDO_HISTORY']) || 25,

    /** Maximum size attribute of items (for validation) */
    MAX_ITEM_SIZE: parseInt(process.env['MAX_ITEM_SIZE']) || 50,

     /** Maximum size attribute of items (for validation) */
     MAX_EMIT_COUNT: parseInt(process.env['MAX_EMIT_COUNT']) || 2000,

    /** Maximum size attribute of items (for validation) */
    MAX_EMIT_COUNT_PERIOD: parseInt(process.env['MAX_EMIT_COUNT_PERIOD']) || 1000,

    /** Maximum size of uploaded documents default 3MB */
    MAX_DOUMENT_SIZE: parseInt(process.env['MAX_DOCUMENT_SIZE']) || 3145728 ,

    /** Maximum number of documents allowed*/
    MAX_DOCUMENTS: parseInt(process.env['MAX_DOCUMENTS']) || 5,

    /** Maximum physical size of board (50MB) */
    MAX_BOARD_BYTES: parseInt(process.env['MAX_BOARD_BYTES']) || 52428800,

     /** Use a template to validate board data */
     DISPLAY_POINTERS: process.env['DISPLAY_POINTERS'] || true

}


