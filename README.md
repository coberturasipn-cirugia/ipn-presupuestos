# 🏥 IPN — Sistema de Presupuestos Quirúrgicos

**Instituto Privado del Niño y Adolescente**  
Sistema web de gestión de presupuestos quirúrgicos. Funciona completamente en el navegador, sin servidor ni base de datos externa.

---

## ✨ Funcionalidades

| Función | Descripción |
|---|---|
| 🔢 Autonumérico | Cada presupuesto recibe un número único e incremental automático |
| 📋 Formulario completo | Datos del paciente, seguro, cirugía, equipo médico |
| 🧮 Calculadora | Cantidad × Precio Unitario = Total automático |
| 📝 Columna Detalle | Descripción libre para cada concepto |
| 💰 Cargo Paciente / Seguro | Si Cargo Paciente = 0, el total pasa automáticamente a Cargo Seguro |
| 💾 Guardar | Todos los presupuestos se guardan en el navegador (localStorage) |
| 🔍 Buscar | Buscá por nombre, N°, cirugía, seguro o cirujano |
| ✏️ Marca de modificación | Si un presupuesto guardado es editado, se marca con fecha y hora |
| 📄 Exportar PDF | Genera un PDF profesional listo para imprimir o enviar |
| 📱 WhatsApp | Envía el resumen del presupuesto por WhatsApp con un clic |
| 🎨 Responsive | Funciona en computadoras, tablets y celulares |

---

## 🗂️ Estructura del Proyecto

```
ipn-presupuestos/
│
├── index.html        ← Aplicación completa (un solo archivo)
└── README.md         ← Este archivo
```

> Todo el sistema está en **un solo archivo HTML**. No necesita instalación, servidor ni internet (excepto para WhatsApp y las fuentes de Google).

---

## 🚀 Cómo usar localmente

1. Descargá o cloná el repositorio
2. Abrí `index.html` con **Google Chrome** o **Microsoft Edge**
3. ¡Listo! El sistema funciona directamente

---

## 🌐 Cómo publicar con GitHub Pages (gratis)

Una vez subido el repositorio (ver guía abajo), activá GitHub Pages:

1. En tu repositorio → **Settings**
2. Sección **Pages** (menú izquierdo)
3. En *Branch* seleccioná `main` y carpeta `/root`
4. Hacé clic en **Save**
5. En 1-2 minutos tu app estará disponible en:  
   `https://TU-USUARIO.github.io/ipn-presupuestos/`

---

## ⚠️ Sobre el almacenamiento de datos

Los presupuestos se guardan en el **localStorage** del navegador:

- ✅ Los datos **persisten** al cerrar y reabrir el navegador
- ✅ Funciona **sin internet** (offline)
- ⚠️ Los datos son **por dispositivo** — no se sincronizan entre computadoras
- ⚠️ Si borrás el historial/caché del navegador, se pierden los datos

**Recomendación:** Exportá los presupuestos importantes en PDF y guardalos en una carpeta.

---

## 🔧 Tecnologías usadas

- HTML5 / CSS3 / JavaScript vanilla
- [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) — generación de PDF
- [Google Fonts](https://fonts.google.com) — tipografías Montserrat e Inter
- localStorage — almacenamiento local en el navegador

---

## 👨‍💻 Desarrollo

Para modificar la aplicación editá directamente el archivo `index.html`.  
No se necesitan herramientas de compilación ni dependencias npm.

---

*Instituto Privado del Niño y Adolescente — Sistema interno*
