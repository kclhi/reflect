* setup

1. pull templates: `faas-cli template pull https://github.com/kclreflect/openfaas-node16-fastify-typescript`
2. run `faas-cli up -f [function name].yml`

* openfaas quirks:

- `node_modules` within the function folder delays build time considerably. install all function dependencies in parent folder (e.g. `npm install notify/`) when testing locally.
