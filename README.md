# Centro Laseda | Estandarización documental

Aplicación Nuxt 3 para la demo interna de estandarización de documentos PDF y PPTX.

## Desarrollo

```bash
npm install
npm run dev
```

Abre la URL local que muestra Nuxt en la terminal.

## Alcance de esta demo

- La contraseña se comprueba en el cliente y no protege datos ni rutas. No debe usarse como autenticación de producción.
- El procesamiento y la descarga son simulados; no se carga, transforma ni genera ningún documento real.
- Para producción, conecta la autenticación a un servicio seguro y reemplaza el temporizador y la acción de descarga por el servicio de generación documental.