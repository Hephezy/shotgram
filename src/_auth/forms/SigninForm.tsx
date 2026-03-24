import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loader from "@/components/shared/Loader";
import { SigninValidation } from "@/lib/validation";
import { useSignInAccount } from "@/lib/react-query/queriesAndMutations";
import { useUserContext } from "@/context/AuthContext";
import { supabase } from '@/lib/supabase/config';

const SigninForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();
  const { mutateAsync: signInAccount } = useSignInAccount();

  const form = useForm<z.infer<typeof SigninValidation>>({
    resolver: zodResolver(SigninValidation),
    defaultValues: { email: '', password: '' },
  });

  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const redirectTo =
        import.meta.env.VITE_AUTH_REDIRECT_URL || `${window.location.origin}/`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) throw error;
    } catch (error) {
      const errorMessage =
        error instanceof Error &&
        error.message.includes('Unsupported provider')
          ? 'Google auth is not enabled in Supabase. Enable Google under Auth > Providers.'
          : 'Please try again.';

      toast({ title: "Google Login Failed", description: errorMessage });
    }
  };

  async function onSubmit(values: z.infer<typeof SigninValidation>) {
    const session = await signInAccount({
      email: values.email,
      password: values.password
    });

    if (!session) {
      return toast({ title: "Sign In Failed. Please check your email/password." });
    }

    const isLoggedIn = await checkAuthUser();
    if (isLoggedIn) {
      form.reset();
      navigate('/');
    } else {
      return toast({ title: "Login Failed. Please try again." });
    }
  }

  return (
    <Form {...form}>
      <div className="sm:w-420 flex-center flex-col">
        <img src="/assets/images/logo.svg" alt="logo" />
        <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">Log In to your account</h2>
        <p className="text-light-3 small-medium md:base-regular mt-2">Welcome Back, please enter your details</p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 w-full mt-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" className="shad-input" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl><Input type="password" className="shad-input" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="shad-button_primary">
            {isUserLoading ? <div className="flex-center gap-2"><Loader /> Loading...</div> : "Sign In"}
          </Button>

          <Button type="button" className="shad-button_dark_4 flex gap-2 w-full" onClick={handleGoogleLogin}>
            <img src="/assets/icons/google.svg" alt="google" width={20} /> Sign in with Google
          </Button>

          <p className="text-small-regular text-light-2 text-center mt-2">
            Don't have an account?
            <Link to="/sign-up" className="text-primary-500 text-small-semibold ml-1"> Sign Up</Link>
          </p>
        </form>
      </div>
    </Form>
  );
};

export default SigninForm;
