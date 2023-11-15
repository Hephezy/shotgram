import UserCard from './UserCard'
import { useGetUsers } from '@/lib/react-query/queriesAndMutations';
import Loader from './Loader';
import { useToast } from '../ui/use-toast';

const RightSidebar = () => {

    const { data: creators, isLoading: isUserLoading, isError: isErrorCreators } = useGetUsers(10);
    const { toast } = useToast();

    if (isErrorCreators) {
        toast({ title: "Something went wrong." });

        return;
    }

    return (
        <div className='rightsidebar'>
            <div className='flex flex-col w-full'>
                <div className='flex flex-col gap-10'>
                    <h3 className='h2-bold text-light-1'>Top Creators</h3>

                    {isUserLoading
                        ? <Loader />
                        : (
                            <ul className='grid 2xl:grid-cols-2 gap-6'>
                                {creators?.documents.map((creator) => (
                                    <li key={creator?.$id}>
                                        <UserCard user={creator} />
                                    </li>
                                ))}
                            </ul>
                        )
                    }
                </div>
            </div>
        </div>
    )
}

export default RightSidebar