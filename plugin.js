define(function(require, exports, module) {
  var droplet = require('./droplet/dist/droplet-full.js');

  var OPT_MAP = {
    'ace/mode/coffee': {
      mode: 'coffeescript',
      palette: [
        {
          'name': 'Output',
          'color': 'blue',
          blocks: [
          {'block': 'console.log "hello"'}
          ]
        },
        {
          'name': 'Variables',
          'color': 'blue',
          'blocks': [
          {'block': 'a = 10'},
          {'block': 'a += 10'},
          {'block': 'a -= 10'},
          {'block': 'a *= 10'},
          {'block': 'a /= 10'},
          ]
        },
        {
          'name': 'Functions',
          'color': 'purple',
          'blocks': [
          {'block': 'myFunction = (param) ->\n  ``'},
          {'block': 'myFunction(arg)'},
          {'block': 'return result'}
          ]
        },
        {
          'name': 'Logic',
          'color': 'teal',
          'blocks': [
          {'block': 'a is b'},
          {'block': 'a isnt b'},
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
          {'block': 'for i in [1..10]\n  ``'},
          {'block': 'for el, i in list\n  ``'},
          {'block': 'if a is b\n  ``'},
          {'block': 'if a is b\n  ``\nelse\n  ``'},
          {'block': 'while true\n  ``'},
          {'block': 'myFunction = (param) ->\n  ``'}
          ]
        },
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
        {'block': 'a += 10;'},
        {'block': 'a -= 10;'},
        {'block': 'a *= 10;'},
        {'block': 'a /= 10;'}
        ]
      },
      {
        'name': 'Functions',
        'color': 'purple',
        'blocks': [
        {'block': 'function myFunction(param) {\n  __\n}'},
        {'block': 'myFunction(arg);'},
        {'block': 'return result'}
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

    window._lastEditor = null;

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
        var dropletEditor = aceEditor._dropletEditor = new droplet.Editor(aceEditor, lookupOptions(aceEditor.getSession().$modeId));
        _lastEditor = dropletEditor;
        aceEditor._dropletEditor.setValue(currentValue);

        var button = document.createElement('div');
        button.className = 'c9-droplet-toggle-button';
        button.innerText = '';
        button.style.position = 'absolute';
        button.style.right = '-30px';
        button.style.width = '30px';
        button.style.height = '50px';
        button.style.top = '50%';
        button.style.bottom='50%';
        button.style.marginTop = '-25px';
        button.style.cursor = 'pointer';
        button.style.boxShadow = '0 0 6px gray';
        button.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        button.style.borderTopRightRadius = button.style.borderBottomRightRadius = '5px';
        dropletEditor.paletteElement.appendChild(button);

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
            if (option != null) {
              aceEditor._dropletEditor.bindNewSession(option);
              button.style.display = 'block';
            }
            else {
              button.style.display = 'none';
            }
          }
          window.lastBoundSession = e.session;
          e.session.on('changeMode', function(e) {
          if (aceEditor._dropletEditor.hasSessionFor(aceEditor.getSession())) {
	    aceEditor._dropletEditor.setMode(lookupMode(aceEditor.getSession().$modeId));
	    aceEditor._dropletEditor.setPalette(lookupPalette(aceEditor.getSession().$modeId));
	  }
	  else {
	    var option = lookupOptions(aceEditor.getSession().$modeId);
	    if (option != null) {
	      aceEditor._dropletEditor.bindNewSession(option);
	      button.style.display = 'block';
	    }
	    else {
	      button.style.display = 'none';
	    }
	  }
        })
        });

        // Bind to mode changes
        aceEditor.getSession().on('changeMode', function(e) {
          if (aceEditor._dropletEditor.hasSessionFor(aceEditor.getSession())) {
	    aceEditor._dropletEditor.setMode(lookupMode(aceEditor.getSession().$modeId));
	    aceEditor._dropletEditor.setPalette(lookupPalette(aceEditor.getSession().$modeId));
	  }
	  else {
	    var option = lookupOptions(aceEditor.getSession().$modeId);
	    if (option != null) {
	      aceEditor._dropletEditor.bindNewSession(option);
	      button.style.display = 'block';
	    }
	    else {
	      button.style.display = 'none';
	    }
	  }
        })

        // Bind to the associated resize event
        tabManager.getTabs().forEach(function(tab) {
          var ace = tab.path && tab.editor.ace;
          if (ace == aceEditor && tab.editorType == 'ace') {
            tab.editor.on('resize', function() {
              dropletEditor.resize();
            });
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

      function lookupMode(id) {
        return (OPT_MAP[id] || {mode: null}).mode;
      }

      function lookupPalette(id) {
      	return (OPT_MAP[id] || {palette: null}).palette;
      }

    }

    function detachFromAce(ace) {

    }

    plugin.on("resize", function() {
      alert('hello');
    })

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
