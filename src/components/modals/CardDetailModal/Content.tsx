import { Control, UseFormHandleSubmit } from "react-hook-form";
import { TagItem } from "@/types/card.type";
import Image from "next/image";
import { CommentItemType } from "@/types/comment.type";
import CommentForm from "./CommentForm";
import { RefObject } from "react";
import { CardCommentValues } from "@/types/card.schema";

interface ListProps {
  commentList: CommentItemType[];
  loading: boolean;
  loadingMore: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
}

interface FormProps {
  control: Control<CardCommentValues>;
  isValid: boolean;
  isCreating: boolean;
  submittingCommentId: number | null;
  onFormSubmit: UseFormHandleSubmit<CardCommentValues>;
  onSubmit: (data: CardCommentValues) => void;
}

interface CommentActionProps {
  onUpdate: (commentId: number, content: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
}

interface ContentProps {
  columnTitle: string;
  title: string;
  description: string;
  imageUrl: string;
  tagList: TagItem[];
  listProps: ListProps;
  formProps: FormProps;
  commentActions: CommentActionProps;
}

export default function Content({
  columnTitle,
  title,
  description,
  imageUrl,
  tagList,
  listProps,
  formProps,
  commentActions,
}: ContentProps) {
  return (
    <div className="order-2 tablet:order-1 flex-grow">
      <div className="flex gap-[24px] tablet:gap-[40px] mb-[16px]">
        <div
          className="
          relative flex itmes-center
          text-xs font-regular text-violet-main
          p-[4px_8px_4px_20px] tablet:p-[4px_10px_4px_22px]
          rounded-[16px] bg-violet-light
          
          before:content-[''] before:absolute 
          before:top-1/2 before:-translate-y-1/2 
          before:left-[8px] tablet:before:left-[10px] 
          before:w-[6px] before:h-[6px] before:bg-violet-main
          before:rounded-[100%]
          
          after:content-[''] after:absolute 
          after:top-1/2 after:-translate-y-1/2 
          after:right-[-12px] tablet:after:right-[-20px] 
          after:w-[1px] after:h-[20px] after:bg-gray-base
          "
        >
          {columnTitle}
        </div>
        <div className="flex flex-wrap gap-[8px] tablet:gap-[6px]">
          {tagList.length > 0 &&
            tagList.map((tag, index) => (
              <span
                className="
                  flex justify-center items-center
                  text-xs-tight font-regular 
                  px-[6px] py-[4px] tablet:px-[9.5px] tablet:py-[5px] 
                  rounded-[4px]
                  "
                key={index}
                style={{
                  backgroundColor: tag.bgColor,
                  color: tag.fontColor,
                }}
              >
                {tag.name}
              </span>
            ))}
        </div>
      </div>
      <div className="text-xs-tight tablet:text-md font-regular text-black-pure mb-[32px] tablet:mb-[16px]">
        {description}
      </div>
      <div className="relative w-full h-[168px] tablet:h-[246px] mb-[24px]">
        {imageUrl && (
          <Image
            fill
            className="object-cover rounded-[6px]"
            src={imageUrl}
            alt={`${title} 이미지`}
          />
        )}
      </div>

      <CommentForm
        listProps={listProps}
        formProps={formProps}
        commentActions={commentActions}
      />
    </div>
  );
}
