import { HighlightOff } from "@mui/icons-material";
import { Card, Fade, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

const APPROVED_ORIGIN = "http://localhost:3000";

/**
 * These definitions come from the Shakira code-- but they could be shared as part of a library to reduce redundancy
 */
const MESSAGE_NAME_PREFIX = "@skipify";
const MESSAGE_NAMES = {
  // Outbound
  INIT: `${MESSAGE_NAME_PREFIX}/init`,
  GET_ENROLLMENT_INFO: `${MESSAGE_NAME_PREFIX}/get-enrollment-info`,
  CLOSE_IFRAME: `${MESSAGE_NAME_PREFIX}/close-iframe`,
  // Inbound
  ENROLLMENT_INFO_RECEIVED: `${MESSAGE_NAME_PREFIX}/enrollment-info`,
} as const;

export default function Home() {
  const { watch, control } = useForm();
  const email = watch("email");
  const phone = watch("phone");

  const [closed, setClosed] = useState(false);

  /**
   * Set up listener for the "close iframe" signal-- this is sent as a fire-and-forget message
   */
  useEffect(() => {
    function listenClose(event: MessageEvent) {
      // make sure that the event is coming from the correct source and that the message type is correct
      const { data } = event;
      if (
        event.origin !== APPROVED_ORIGIN ||
        !data ||
        data.name !== MESSAGE_NAMES.CLOSE_IFRAME
      ) {
        return;
      }

      console.log("Closing the iframe!");
      setClosed(true);
      setTimeout(() => setClosed(false), 1000);
    }

    window.addEventListener("message", listenClose);
    return () => window.removeEventListener("message", listenClose);
  }, []);

  /**
   * Set up listener for the "get enrollment data" signal-- this is a request-response
   */
  useEffect(() => {
    function listenEnrollment(event: MessageEvent) {
      // make sure that the event is coming from the correct source and that the message type is correct
      const { data } = event;
      if (
        event.origin !== APPROVED_ORIGIN ||
        !data ||
        data.name !== MESSAGE_NAMES.GET_ENROLLMENT_INFO
      ) {
        return;
      }

      console.log("Sending enrollment info!");
      event.ports[0]?.postMessage({
        payload: { email, phone },
        name: MESSAGE_NAMES.ENROLLMENT_INFO_RECEIVED,
      });
    }

    window.addEventListener("message", listenEnrollment);
    return () => window.removeEventListener("message", listenEnrollment);
  }, [email, phone]);

  return (
    <>
      <Stack alignItems={"center"} mt={2}>
        <Card sx={{ maxWidth: "fit-content" }}>
          <iframe
            src="http://localhost:3000/messaging-test"
            style={{ border: 0, height: 375 }}
          />
        </Card>
        <Fade in={closed}>
          <HighlightOff color="warning" fontSize="large" sx={{ mt: 1 }} />
        </Fade>
      </Stack>
      <form>
        <Stack alignItems={"center"} mt={2} spacing={1}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => <TextField {...field} label="Email" />}
          />
          <Controller
            name="phone"
            control={control}
            render={({ field }) => <TextField {...field} label="Phone" />}
          />
        </Stack>
      </form>
    </>
  );
}
