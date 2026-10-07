# 01 · Deploy oficial y seguridad

Hoy el sitio vive en GitHub Pages (`inzumer.github.io/milimon-frontend-web`) y la API se prepara para Render +
Neon. Para el lanzamiento oficial conviene un dominio propio y un hosting que permita **cabeceras
HTTP de seguridad**, algo que GitHub Pages no deja configurar.

## Dominio

- Opciones: `milimon.com` / `.com.ar` (NIC Argentina) / `.es` (Milagros vive en España). Conviene
  comprar el `.com` y, si se puede, el `.com.ar` o `.es` para redirigirlos.
- Registrar en un proveedor con DNS gestionado y bloqueo de transferencia (Cloudflare Registrar,
  Namecheap o el propio NIC).
- Subdominios: `milimon.com` (sitio) y `api.milimon.com` (API).

## Hosting del sitio (gratis)

| Opción               | Ventajas                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Cloudflare Pages** | Recomendada: CDN global, HTTPS automático, archivo `_headers` para cabeceras, redirecciones, previews por rama, analítica sin cookies. |
| Netlify              | Muy similar (`_headers`, `_redirects`), plan gratuito con límites de minutos de build.                                                 |
| Vercel               | Buen soporte de Astro; las cabeceras se configuran en `vercel.json`.                                                                   |

La API sigue en **Render** (o Fly.io / Railway si el "sueño" del plan gratuito molesta) con la
base en **Neon**, apuntando `api.milimon.com` al servicio.

## Pasos de migración

1. Build con `BASE_PATH` vacío y `SITE_URL=https://milimon.com` (el código ya lo soporta).
2. Configurar el dominio en el hosting y el DNS; esperar el certificado HTTPS.
3. Mover la CSP del `<meta>` a la cabecera `Content-Security-Policy` (permite `frame-ancestors`,
   `report-to` y es más robusta) y sumar el resto de cabeceras (ver abajo).
4. API: `CORS_ORIGIN=https://milimon.com`, `FRONTEND_URL=https://milimon.com`, dominio propio.
5. Google OAuth: agregar `https://milimon.com` a los orígenes autorizados. Meta: dominio de la app.
6. Variables `PUBLIC_*` del front apuntando a `https://api.milimon.com`.
7. GitHub Pages: dejar una página que redirija cada ruta al dominio nuevo (Pages no permite 301
   del lado del servidor) o apagarlo después de que Google reindexe.
8. Search Console y Bing Webmaster Tools con el dominio nuevo; enviar el sitemap.

## Cabeceras de seguridad (hosting)

```
Content-Security-Policy: (la misma política de hoy) + frame-ancestors 'none'; upgrade-insecure-requests
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Cross-Origin-Opener-Policy: same-origin-allow-popups   (necesario para los popups de Google/Facebook)
```

## Auditoría de seguridad

**Front**

- [ ] Revisar la CSP: sin `unsafe-inline` en scripts (hoy se cumple con hashes), orígenes mínimos.
- [ ] Escaneos externos: [Mozilla Observatory](https://observatory.mozilla.org/),
      [securityheaders.com](https://securityheaders.com/), [SSL Labs](https://www.ssllabs.com/ssltest/).
- [ ] OWASP ZAP (baseline scan) contra el sitio y la API.
- [ ] Tokens: hoy viven en `localStorage`; evaluar pasar el refresh token a cookie `HttpOnly`,
      `Secure`, `SameSite=Strict` en el dominio propio (reduce el impacto de un XSS).
- [x] Dependencias: `pnpm audit` en CI (falla ante cualquier vulnerabilidad); se actualizan a mano, sin Dependabot.

**API**

- [ ] Rate limits (ya existen), tamaños de body, validación de entrada (ya existe) y errores sin
      detalles internos en producción.
- [ ] Secretos solo en Render; rotar `JWT_SECRET` y la api-key al lanzar; revisar que no haya
      secretos en el historial de git (`gitleaks`).
- [ ] Swagger apagado en producción (hoy lo está) o protegido.
- [ ] Backups de Neon (point-in-time) y prueba de restauración.
- [ ] Logs sin datos personales; alertas de errores (Sentry, plan gratuito).

**Legal (Milagros vive en España: RGPD + LSSI)**

- [ ] **Aviso legal** con identidad de la titular (obligatorio en España para sitios con actividad
      económica, incluso con afiliados o ventas).
- [ ] Política de privacidad y de cookies actualizadas con el dominio, encargados de tratamiento
      (Google, Render, Neon, proveedor de email) y derechos ARCO.
- [ ] Consentimiento de cookies (ya existe) y registro del consentimiento.

## Checklist de lanzamiento

- [ ] Todas las páginas responden 200 y las inexistentes 404 en el dominio nuevo.
- [ ] Login con Google de punta a punta (y Facebook cuando exista la app).
- [ ] Lighthouse ≥ 90 en rendimiento, accesibilidad, buenas prácticas y SEO.
- [ ] Auditoría a11y (`scripts/a11y-audit.mjs`) sin violaciones.
- [ ] Monitoreo de disponibilidad (UptimeRobot, gratis) para el sitio y `api/health`.
