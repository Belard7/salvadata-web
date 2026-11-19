# SalvaData – Landing page y checkout

Sitio web estático (HTML, CSS y JavaScript puro, sin frameworks) para la Semana de Emprendimiento.

## Cómo abrirlo
1. Descomprime la carpeta.
2. Abre `index.html` con doble clic (Chrome, Edge o Firefox).
3. Con internet se cargan las fuentes y los logotipos de las tarjetas. Sin internet la página funciona igual: en lugar de los logotipos aparecen los nombres de las marcas.

## Estructura
```
salvadata-web/
├── index.html      → Landing page (8 secciones)
├── checkout.html   → Página de pago
├── css/styles.css  → Estilos y diseño responsive (celular, tablet y PC)
└── js/
    ├── main.js     → Menú móvil de la landing
    └── checkout.js → Lógica del pago: planes, formato de tarjeta, detección de marca y validación
```

## Secciones de la landing (Parte 1)
| # | Sección | Dónde está |
|---|---------|------------|
| 1 | Hero (titular, subtítulo, imagen y CTA) | `#inicio` |
| 2 | Problema y solución | `#problema` |
| 3 | Mockup del producto (dashboard web) | `#producto` |
| 4 | ¿Cómo funciona? (3 pasos) | `#como-funciona` |
| 5 | Desglose de valor ($70 → $20/mes) | `#precio` |
| 6 | Prueba social (antes/después y testimonios ilustrativos) | `#testimonios` |
| 7 | Preguntas frecuentes (10) | `#faq` |
| 8 | Garantía y CTA final | `#garantia` |

## Checkout (Parte 2)
- Planes: mensual ($20) o prueba gratis de 14 días sin tarjeta. Los botones de la landing abren el checkout con el plan ya elegido (`?plan=prueba` o `?plan=mensual`).
- Logotipos de Visa, Mastercard, American Express, Diners Club, Discover y PayPal (vía Font Awesome).
- Detecta la marca mientras escribes, da formato al número y a la fecha (MM/AA) y muestra una vista previa de la tarjeta.
- Valida los datos: número con el algoritmo de Luhn, vencimiento, CVC de 3 o 4 dígitos y correo.
- Pantalla de confirmación al final.

**Tarjetas de prueba:** `4242 4242 4242 4242` (Visa), `5555 5555 5555 4444` (Mastercard), `3782 822463 10005` (Amex). Cualquier fecha futura y cualquier CVC.

> Es una demostración académica: no se envían datos a ningún servidor ni se procesan pagos reales.

## Publicarlo en internet (opcional, gratis)
- **Netlify Drop:** arrastra la carpeta a https://app.netlify.com/drop
- **GitHub Pages:** sube los archivos a un repositorio y activa *Settings › Pages*.
