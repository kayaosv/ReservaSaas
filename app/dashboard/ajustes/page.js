import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AjustesClient } from "./AjustesClient"

export default async function AjustesPage() {
  const session = await auth()

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
  })

  return <AjustesClient restaurant={restaurant} />
}
