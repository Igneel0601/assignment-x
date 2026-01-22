import LoginView from "@/components/views/LoginView";
import {authOptions} from "@/lib/authOptions";
import {getServerSession} from "next-auth";
import StudentForm from "@/components/forms/StudentForm";


export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <LoginView />
    );
  }
  return (
    <div className="p-8 flex items-center justify-center ">
      <StudentForm />
    </div>
  )
}