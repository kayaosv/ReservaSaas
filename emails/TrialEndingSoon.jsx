import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Text,
} from "@react-email/components"

export const TrialEndingSoon = ({ restaurantName, daysLeft, activateUrl }) => (
  <Html lang="es">
    <Head />
    <Preview>Tu prueba gratis termina en {daysLeft} días</Preview>
    <Body style={body}>
      <Container style={container}>
        <Heading style={h1}>RestoBook</Heading>
        <Text style={p}>Hola {restaurantName},</Text>
        <Text style={p}>
          Tu prueba gratis termina en <strong>{daysLeft} día{daysLeft === 1 ? "" : "s"}</strong>.
          Para seguir recibiendo reservas sin interrupción, activa tu suscripción ahora.
        </Text>
        <Text style={p}>
          Plan RestoBook — 29€/mes, sin comisiones, cancela cuando quieras.
        </Text>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Button href={activateUrl} style={btnPrimary}>Activar suscripción</Button>
        </div>
        <Hr style={hr} />
        <Text style={footer}>RestoBook</Text>
      </Container>
    </Body>
  </Html>
)

const body = { backgroundColor: "#f9fafb", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", margin: 0, padding: 0 }
const container = { backgroundColor: "#ffffff", maxWidth: 560, margin: "32px auto", padding: 32, borderRadius: 8, border: "1px solid #e5e7eb" }
const h1 = { fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 16px" }
const p = { fontSize: 15, color: "#374151", margin: "8px 0", lineHeight: 1.5 }
const btnPrimary = { backgroundColor: "#111827", color: "#ffffff", padding: "12px 22px", borderRadius: 6, fontSize: 14, textDecoration: "none", display: "inline-block" }
const hr = { borderColor: "#e5e7eb", margin: "24px 0" }
const footer = { fontSize: 12, color: "#9ca3af", textAlign: "center", margin: 0 }
