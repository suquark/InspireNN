SystemJS.config({
    map: {
        'plugin-traceur': '../../transpiler/plugin-traceur.js',
        'traceur': '../../transpiler/traceur.js',
        'traceur-runtime': '../../transpiler/traceur-runtime.js'
    },
    meta: {
        'traceur': {
            format: 'global',
            exports: 'traceur',
            scriptLoad: false
        },
        'traceur-runtime': {
            format: 'global',
            exports: '$traceurRuntime'
        }
    },
    transpiler: 'plugin-traceur',
    transpilerRuntime: false,
    baseURL: '../../'
});