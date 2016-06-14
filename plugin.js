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
                if (dropletEditor && dropletEditor.hasSessionFor(dropletEditor.aceEditor.getSession())) dropletEditor.toggleBlocks();
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
	    if (!aceEditor._dropletEditor) {
		    var currentValue = aceEditor.getValue();
		    dropletEditor = aceEditor._dropletEditor = new droplet.Editor(aceEditor, {mode: 'coffeescript', palette: [
		      {
			'name': 'Palette option 1',
			'blocks': [
			  {
			    'block': 'fd 10'
			  }
			]
		      }
		    ]});
		    aceEditor._dropletEditor.setValue(currentValue);
	    }

            // here we get an instance of ace
            // we can listen for setSession
            // and create droplet editor attached to this ace instance
            // it can work similar to http://pencilcode.net/edit/first
            // where there is a widget on the gutter displayed for all coffee files
            aceEditor.on("changeSession", function(e) {
                if (!aceEditor._dropletEditor.hasSessionFor(e.session)) {
                    if (e.session.$modeId == 'ace/mode/coffee') {
                        aceEditor._dropletEditor.bindNewSession({mode: 'coffeescript', palette: [
                            {
                                'name': 'Palette option 1',
                                'blocks': [
                                    {
                                        'block': 'fd 10'
                                    }
                                ]
                            }
                        ]});
                    }
                }
            });
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
