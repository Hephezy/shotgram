import UserCard from './UserCard'
import { useGetUsers } from '@/lib/react-query/queriesAndMutations';
import Loader from './Loader';
import { useToast } from '../ui/use-toast';
import { useEffect } from 'react';
import { useUserContext } from '@/context/AuthContext';

const RightSidebar = () => {
    const { user } = useUserContext();
    const { data: creators, isLoading: isUserLoading, isError: isErrorCreators } = useGetUsers(10);
    const { toast } = useToast();

    useEffect(() => {
        if (isErrorCreators) {
            toast({ title: "Something went wrong." });
        }
    }, [isErrorCreators, toast]);

    // If error, you can return null or just don't render the list
    if (isErrorCreators) return null;

    // Filter out the current user from the creators list
    const filteredCreators = creators?.documents.filter(
        (creator) => creator.id !== user.id
    );

    return (
        <div className='rightsidebar'>
            <div className='flex flex-col w-full'>
                <div className='flex flex-col gap-10'>
                    <h3 className='h2-bold text-light-1'>Top Creators</h3>

                    {isUserLoading
                        ? <Loader />
                        : (
                            <ul className='grid 2xl:grid-cols-2 gap-6'>
                                {filteredCreators?.map((creator) => (
                                    <li key={creator?.id}>
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

export default RightSidebar;