import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components"

export const InvoiceReady = ({
  customerName,
  restaurantName,
  downloadUrl,
}) => (
  <Html lang="es">
    <Head />
    <Preview>Tu factura de {restaurantName} ya está disponible</Preview>
    <Body style={body}>
      <Container style={container}>
        <Heading style={h1}>{restaurantName}</Heading>
        <Text style={p}>Hola {customerName},</Text>
        <Text style={p}>La factura que solicitaste ya está lista. Puedes descargarla con el botón siguiente.</Text>
        <Text style={p}>El enlace caduca en 1 hora; si lo necesitas más tarde, contesta a este email y te lo reenviamos.</Text>

        <Section style={{ textAlign: "center", marginTop: 24 }}>
          <Button href={downloadUrl} style={btnPrimary}>Descargar factura</Button>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>{restaurantName}</Text>
      </Container>
    </Body>
  </Html>
)

const body = { backgroundColor: "#f9fafb", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", margin: 0, padding: 0 }
const container = { backgroundColor: "#ffffff", maxWidth: 560, margin: "32px auto", padding: 32, borderRadius: 8, border: "1px solid #e5e7eb" }
const h1 = { fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 16px" }
const p = { fontSize: 15, color: "#374151", margin: "8px 0", lineHeight: 1.5 }
const btnPrimary = { backgroundColor: "#111827", color: "#ffffff", padding: "10px 18px", borderRadius: 6, fontSize: 14, textDecoration: "none", display: "inline-block" }
const hr = { borderColor: "#e5e7eb", margin: "24px 0" }
const footer = { fontSize: 12, color: "#9ca3af", textAlign: "center", margin: 0 }
