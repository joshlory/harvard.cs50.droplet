define(function(require, exports, module) {
    var droplet = require('./droplet/dist/droplet-full.js');

    main.consumes = ["Plugin", "tabManager", "ace", "ui", "commands", "menus"];
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

        var dropletEditor = null;

        commands.addCommand({
            name: "droplet_toggle",
            bindKey: {
                mac: "Command-I",
                win: "Ctrl-I"
            },
            exec: function() {
                if (dropletEditor) dropletEditor.toggleBlocks();
            }
        }, plugin);

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

        function attachToAce(aceEditor) {
            // here we get an instance of ace
            // we can listen for setSession
            // and create droplet editor attached to this ace instance
            // it can work similar to http://pencilcode.net/edit/first
            // where there is a widget on the gutter displayed for all coffee files
            aceEditor.on("changeSession", function(e) {
                if (e.session && e.session.$modeId == "ace/mode/coffee")
                    activateDroplet(aceEditor, e.session);
                else
                    deactivateDroplet(aceEditor, e.oldSession);
                if (dropletEditor) dropletEditor.setValue(e.session.getValue());
            });
            if (aceEditor.session && aceEditor.session.$modeId == "ace/mode/coffee")
                activateDroplet(aceEditor, aceEditor.session);
        }
        function activateDroplet(aceEditor) {
            //if (!dropletEditor) {
            //Remove the old droplet editor
            if (dropletEditor)
              dropletEditor.dropletElement.parentElement.removeChild(dropletEditor.dropletElement);
            //Create a new droplet editor
            var currentValue = aceEditor.getValue();
            dropletEditor = new droplet.Editor(aceEditor, {mode: 'coffeescript', palette: []});
            dropletEditor.setValue(currentValue);
            //}
            //dropletEditor.setEditorState(true);
        }
        function deactivateDroplet(aceEditor) {
            if (dropletEditor)
                dropletEditor.setEditorState(false);
        }
        function detachFromAce(ace) {

        }

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
