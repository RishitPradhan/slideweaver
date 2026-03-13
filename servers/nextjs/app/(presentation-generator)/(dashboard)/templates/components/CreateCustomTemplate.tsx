import { Plus, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation';
import React from 'react'

const CreateCustomTemplate = () => {
    const router = useRouter();
    return (
        <div
            onClick={() => {
                router.push('/custom-template')
            }}
            className='w-full rounded-xl border border-neutral-800 cursor-pointer font-syne bg-[#222222] hover:border-[#dc2626] transition-colors'>
            <div className='relative h-[215px] flex justify-center items-center '>
                <div className='w-[36px] h-[36px] relative z-[4]  rounded-full bg-[#7A5AF8] flex items-center justify-center'
                    style={{
                        background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.20) 100%), #FFF'
                    }}
                ><div className='w-[26px] h-[26px] rounded-full bg-[#111111] flex items-center justify-center'>

                        <Plus className='w-4 h-4 text-[#A2A0A1]' />
                    </div>
                </div>
            </div>
            <div className='px-5 py-4 flex items-center gap-4 bg-[#111111] border-t border-neutral-800'>
                <div className='bg-[#dc2626] w-[45px] h-[45px] rounded-lg p-2 flex items-center justify-center'>

                    <Sparkles className='w-6 h-6 text-white' />
                </div>
                <div>
                    <h4 className='text-white text-sm font-semibold '>Build Template</h4>
                    <p className='flex text-[#808080] text-sm  font-medium items-center gap-2'>Build Your Own Template</p>
                </div>

            </div>
        </div>
    )
}

export default CreateCustomTemplate
