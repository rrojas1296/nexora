import ngrok from "@ngrok/ngrok";

async function main() {
  if (!process.env.NGROK_AUTHTOKEN?.trim()) {
    throw new Error(
      "Configura NGROK_AUTHTOKEN en .env.ngrok o en tu entorno antes de ejecutar pnpm ngrok.",
    );
  }

  const port = process.env.NGROK_PORT ?? "8000";
  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
    throw new Error("NGROK_PORT debe ser un puerto entre 1 y 65535.");
  }

  const address = `127.0.0.1:${Number(port)}`;
  console.log(`Abriendo túnel público hacia http://${address}.`);
  console.log("Se expone toda la API local. No lo uses con datos o credenciales de producción.");

  const stop = async () => {
    try {
      await ngrok.disconnect();
    } finally {
      process.exit(0);
    }
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  let listener;
  try {
    listener = await ngrok.forward({ addr: address, authtoken_from_env: true });
  } catch {
    throw new Error(
      "No se pudo abrir el túnel. Revisa NGROK_AUTHTOKEN, tu conexión y los límites de tu cuenta ngrok.",
    );
  }

  const url = listener.url();
  console.log(`URL pública: ${url}`);
  console.log(`Webhook de Meta: ${url}/api/v1/whatsapp/webhook`);
  console.log("La API debe estar ejecutándose en otra terminal. Ctrl+C cierra el túnel.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
