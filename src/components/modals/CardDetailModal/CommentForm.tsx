import ButtonInputDelete from "@/components/common/Button/ButtonInputDelete";
import { CommentItemType } from "@/types/comment.type";
import { RefObject } from "react";
import { Control, Controller, UseFormHandleSubmit } from "react-hook-form";
import CommentItem from "./CommentItem";
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

interface CommentProps {
  listProps: ListProps;
  formProps: FormProps;
  commentActions: CommentActionProps;
}

export default function CommentForm({
  listProps,
  formProps,
  commentActions,
}: CommentProps) {
  const {
    control,
    isValid,
    onFormSubmit,
    onSubmit,
    isCreating,
    submittingCommentId,
  } = formProps;
  const { commentList, loading, loadingMore, sentinelRef } = listProps;
  return (
    <div
      className={`flex flex-col ${commentList.length > 0 ? "gap-[16px]" : ""} max-h-[180px] tablet:max-h-[236px] overflow-y-auto`}
    >
      <form onSubmit={onFormSubmit(onSubmit)}>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <div>
              <div className="mb-[4px]">
                <label
                  className="text-md tablet:text-lg font-medium text-black-medium"
                  htmlFor={field.name}
                >
                  댓글
                </label>
              </div>
              <div
                className="
                    relative
                    h-[70px] tablet:h-[110px] 
                    p-[12px_20px_12px_12px] tablet:p-[16px_12px_12px_16px]
                    border border-gray-base rounded-[6px]
                    "
              >
                <textarea
                  {...field}
                  id={field.name}
                  className="
                      resize-none 
                      w-[calc(100%-90px)] tablet:w-[calc(100%-80px)] h-full 
                      text-xs-tight tablet:text-md font-regular text-black-medium
                      placeholder-gray-medium placeholder:font-regular
                      outline-none focus:outline-none
                      "
                  placeholder="댓글 작성하기"
                />
                <ButtonInputDelete
                  type="submit"
                  variant="secondary"
                  disabled={!isValid || isCreating}
                  className="
                      absolute right-[20px] bottom-[12px] tablet:right-[11px]
                      w-[84px] h-[28px] tablet:w-[77px] tablet:h-[32px]
                      text-xs-tight font-medium
                      "
                >
                  입력
                </ButtonInputDelete>
              </div>
            </div>
          )}
        />
      </form>

      <ul className="flex flex-col gap-[15px] tablet:gap-[20px]">
        {loading ? (
          <div className="py-[40px] text-center text-md text-gray-dark">
            불러오는 중...
          </div>
        ) : (
          <>
            {commentList.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                commentActions={commentActions}
                isSubmitting={isCreating || submittingCommentId === comment.id}
              />
            ))}
          </>
        )}

        <div
          ref={sentinelRef}
          className="w-full h-[1px] opacity-0 pointer-events-none"
          aria-hidden="true"
        />

        {loadingMore && (
          <li className="py-[10px] text-center text-xs text-gray-medium">
            더 불러오는 중...
          </li>
        )}
      </ul>
    </div>
  );
}
