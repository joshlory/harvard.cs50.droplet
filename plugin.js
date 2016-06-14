define(function(require, exports, module) {
  var droplet = require('./droplet/dist/droplet-full.js');

  var OPT_MAP = {
    'ace/mode/coffee': {
      mode: 'coffeescript',
      palette: [
        {
          'name': 'dur',
          'color': 'blue',
          blocks: [
          {'block': 'dur dur'}
          ]
        }
      ]
    },
    'ace/mode/javascript': {
      mode: 'javascript',
      palette: [
      {
        'name': 'Output',
        'color': 'blue',
        'blocks': [
        {'block': 'console.log("hello");'},
        ]
      },
      {
        'name': 'Variables',
        'color': 'blue',
        'blocks': [
        {'block': 'var a = 10;'},
        {'block': 'a = 10;'},
        {'block': 'a += 1;'},
        {'block': 'a -= 10;'},
        {'block': 'a *= 1;'},
        {'block': 'a /= 1;'}
        ]
      },
      {
        'name': 'Functions',
        'color': 'purple',
        'blocks': [
        {'block': 'function myFunction(param) {\n  __\n}'},
        {'block': 'myFunction(arg);'},
        ]
      },
      {
        'name': 'Logic',
        'color': 'teal',
        'blocks': [
        {'block': 'a === b'},
        {'block': 'a !== b'},
        {'block': 'a > b'},
        {'block': 'a < b'},
        {'block': 'a || b'},
        {'block': 'a && b'},
        {'block': '!a'}
        ]
      },
      {
        'name': 'Operators',
        'color': 'green',
        'blocks': [
        {'block': 'a + b'},
        {'block': 'a - b'},
        {'block': 'a * b'},
        {'block': 'a / b'},
        {'block': 'a % b'},
        {'block': 'Math.pow(a, b)'},
        {'block': 'Math.sin(a)'},
        {'block': 'Math.tan(a)'},
        {'block': 'Math.cos(a)'},
        {'block': 'Math.random()'}
        ]
      },
      {
        'name': 'Control flow',
        'color': 'orange',
        'blocks': [
        {'block': 'for (var i = 0; i < 10; i++) {\n  __\n}'},
        {'block': 'if (a === b) {\n  __\n}'},
        {'block': 'if (a === b) {\n  __\n} else {\n  __\n}'},
        {'block': 'while (true) {\n  __\n}'},
        {'block': 'function myFunction(param) {\n  __\n}'}
        ]
      },
      ]
    }
  };

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

    window.dropletEditor = null;

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
        dropletEditor = aceEditor._dropletEditor = new droplet.Editor(aceEditor, lookupOptions(aceEditor.getSession().$modeId));
        aceEditor._dropletEditor.setValue(currentValue);

        var button = document.createElement('button');
        button.innerText = 'Toggle!';
        button.style.position = 'absolute';
        button.style.top = '0px';
        button.style.right = '0px';
        button.style.zIndex = '9999';
        dropletEditor.wrapperElement.appendChild(button);

        button.addEventListener('click', function() {
          aceEditor._dropletEditor.toggleBlocks();
        });

        // here we get an instance of ace
        // we can listen for setSession
        // and create droplet editor attached to this ace instance
        // it can work similar to http://pencilcode.net/edit/first
        // where there is a widget on the gutter displayed for all coffee files
        aceEditor.on("changeSession", function(e) {
          if (aceEditor._dropletEditor.hasSessionFor(e.session)) {
            button.style.display = 'block';
          }
          else {
            var option = lookupOptions(e.session.$modeId);
            if (option) {
              aceEditor._dropletEditor.bindNewSession(option);
              button.style.display = 'block';
            }
            else {
              button.style.display = 'none';
            }
          }
        });

      }

      function lookupOptions(mode) {
        if (mode in OPT_MAP) {
          return OPT_MAP[mode];
        }
        else {
          return null;
        }
      }

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
