export default defineEventHandler(async (event) => {
  const body = await readBody<{ password?: string }>(event)
  const password = body?.password ?? ''

  const { accessPassword } = useRuntimeConfig()

  if (!password || password !== accessPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: { message: 'La contrasena no es valida.' }
    })
  }

  return { success: true }
})
