import React, {useCallback, useState} from "react";
import {useHistory, useLocation} from "react-router-dom";
import {defineMessages, useIntl} from "react-intl";
import {
  Box,
  Button,
  CircularProgress,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  useToast,
} from "@chakra-ui/core";
import {useApi, useAuthToken, useUser} from "src/hooks";
import {NotFoundHttpError} from "src/errors";
import SubmitMessage from "./SubmitMessage";

const messages = defineMessages({
  logout: {
    id: "login.form.logout",
    defaultMessage: "Logout",
  },
  login: {
    id: "login.form.login",
    defaultMessage: "Login",
  },
  email: {
    id: "login.form.email",
    defaultMessage: "Email",
  },
  submit: {
    id: "login.form.submit",
    defaultMessage: "Send me magic link",
  },
  user: {
    id: "login.form.user",
    defaultMessage: "{email}",
  },
  successTitle: {
    id: "login.form.success.title",
    defaultMessage: "Email sent",
  },
  successMessage: {
    id: "login.form.success.message",
    defaultMessage:
      "Please check you mail box ({email}) and click magic link to login",
  },
  error: {
    id: "login.form.error",
    defaultMessage: "Login failed: {error}",
  },
});

export interface Props {
  onSuccess?: () => void;
}

const LoginForm = (props: Props) => {
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();
  const toast = useToast();
  const fetchJSON = useApi();
  const [user, setUser] = useUser();
  const [, logout] = useAuthToken();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // @ts-ignore
  const {from} = location.state || {from: {pathname: "/"}}

  const login = useCallback(
    async ({email}: { email: string }) => {
      // @ts-ignore
      const body = JSON.stringify({email, redirect_path: from});
      try {
        return await fetchJSON(
          "/users/v1/dispatch/user/request-user-access-token",
          "POST",
          null,
          body
        );
      } catch (err) {
        if (err instanceof NotFoundHttpError) {
          return await fetchJSON(
            "/users/v1/dispatch/user/register-user-with-email",
            "POST",
            null,
            body
          );
        }
      }
    },
    [fetchJSON]
  );

  const handleLogout = () => {
    setUser(null);
    logout();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsLoading(true);

    if (email) {
      try {
        await login({email});

        toast({
          position: "top",
          title: intl.formatMessage(messages.successTitle),
          description: intl.formatMessage(messages.successMessage, {email}),
          status: "success",
          duration: 9000,
          isClosable: true,
        });

        if (props.onSuccess) {
          props.onSuccess();
        }
      } catch (err) {
        setError(intl.formatMessage(messages.error, {error: err.message}));
        logout();
      }
    }

    setEmail("");
    setIsLoading(false);
  };

  return (
    <Flex width="full" align="center" justifyContent="center">
      <Box
        p={8}
        maxWidth="500px"
        borderWidth={1}
        borderRadius={8}
        boxShadow="lg"
      >
        {user ? (
          <Box textAlign="center">
            <Text>
              {intl.formatMessage(messages.user, {email: user.email})}
            </Text>
            <Button
              variant="outline"
              width="full"
              mt={4}
              onClick={handleLogout}
            >
              {intl.formatMessage(messages.logout)}
            </Button>
          </Box>
        ) : (
          <>
            <Box textAlign="center">
              <Heading>{intl.formatMessage(messages.login)}</Heading>
            </Box>
            <Box my={4} textAlign="left">
              <form onSubmit={handleSubmit}>
                {error && <SubmitMessage message={error} status="error"/>}
                <FormControl isRequired>
                  <FormLabel>{intl.formatMessage(messages.email)}</FormLabel>
                  <Input
                    type="email"
                    size="lg"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setEmail(event.currentTarget.value)
                    }
                  />
                </FormControl>
                <Button variant="outline" type="submit" width="full" mt={4}>
                  {isLoading ? (
                    <CircularProgress/>
                  ) : (
                    intl.formatMessage(messages.submit)
                  )}
                </Button>
              </form>
            </Box>
          </>
        )}
      </Box>
    </Flex>
  );
};

export default LoginForm;